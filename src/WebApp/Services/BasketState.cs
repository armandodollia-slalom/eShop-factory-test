using System.Security.Claims;
using Grpc.Core;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Authorization;
using eShop.WebAppComponents.Catalog;
using eShop.WebAppComponents.Services;

namespace eShop.WebApp.Services;

public class BasketState(
    BasketService basketService,
    CatalogService catalogService,
    OrderingService orderingService,
    AuthenticationStateProvider authenticationStateProvider) : IBasketState
{
    private Task<(IReadOnlyCollection<BasketItem> Items, IReadOnlyCollection<BasketItem> SavedItems)>? _cachedBasket;
    private HashSet<BasketStateChangedSubscription> _changeSubscriptions = new();

    public Task DeleteBasketAsync()
        => basketService.DeleteBasketAsync();

    public async Task<IReadOnlyCollection<BasketItem>> GetBasketItemsAsync()
        => (await GetUserAsync()).Identity?.IsAuthenticated == true
        ? await FetchBasketItemsAsync()
        : [];

    public async Task<IReadOnlyCollection<BasketItem>> GetSavedItemsAsync()
        => (await GetUserAsync()).Identity?.IsAuthenticated == true
        ? (await FetchBasketAsync()).SavedItems
        : [];

    public IDisposable NotifyOnChange(EventCallback callback)
    {
        var subscription = new BasketStateChangedSubscription(this, callback);
        _changeSubscriptions.Add(subscription);
        return subscription;
    }

    public async Task AddAsync(CatalogItem item)
    {
        var items = (await FetchBasketItemsAsync()).Select(i => new BasketQuantity(i.ProductId, i.Quantity)).ToList();
        bool found = false;
        for (var i = 0; i < items.Count; i++)
        {
            var existing = items[i];
            if (existing.ProductId == item.Id)
            {
                items[i] = existing with { Quantity = existing.Quantity + 1 };
                found = true;
                break;
            }
        }

        if (!found)
        {
            items.Add(new BasketQuantity(item.Id, 1));
        }

        _cachedBasket = null;
        await basketService.UpdateBasketAsync(items);
        await NotifyChangeSubscribersAsync();
    }

    public async Task SetQuantityAsync(int productId, int quantity)
    {
        var existingItems = (await FetchBasketItemsAsync()).ToList();
        if (existingItems.FirstOrDefault(row => row.ProductId == productId) is { } row)
        {
            if (quantity > 0)
            {
                row.Quantity = quantity;
            }
            else
            {
                existingItems.Remove(row);
            }

            _cachedBasket = null;
            await basketService.UpdateBasketAsync(existingItems.Select(i => new BasketQuantity(i.ProductId, i.Quantity)).ToList());
            await NotifyChangeSubscribersAsync();
        }
    }

    public Task SaveForLaterAsync(int productId)
        => ChangeSavedItemsAsync(() => basketService.SaveForLaterAsync(productId));

    public Task MoveToCartAsync(int productId)
        => ChangeSavedItemsAsync(() => basketService.MoveToCartAsync(productId));

    public Task RemoveSavedItemAsync(int productId)
        => ChangeSavedItemsAsync(() => basketService.RemoveSavedItemAsync(productId));

    public async Task CheckoutAsync(BasketCheckoutInfo checkoutInfo)
    {
        if (checkoutInfo.RequestId == default)
        {
            checkoutInfo.RequestId = Guid.NewGuid();
        }

        var buyerId = await authenticationStateProvider.GetBuyerIdAsync() ?? throw new InvalidOperationException("User does not have a buyer ID");
        var userName = await authenticationStateProvider.GetUserNameAsync() ?? throw new InvalidOperationException("User does not have a user name");

        // Get details for the items in the basket
        var orderItems = await FetchBasketItemsAsync();

        // Call into Ordering.API to create the order using those details
        var request = new CreateOrderRequest(
            UserId: buyerId,
            UserName: userName,
            City: checkoutInfo.City!,
            Street: checkoutInfo.Street!,
            State: checkoutInfo.State!,
            Country: checkoutInfo.Country!,
            ZipCode: checkoutInfo.ZipCode!,
            CardNumber: "1111222233334444",
            CardHolderName: "TESTUSER",
            CardExpiration: DateTime.UtcNow.AddYears(1),
            CardSecurityNumber: "111",
            CardTypeId: checkoutInfo.CardTypeId,
            Buyer: buyerId,
            Items: [.. orderItems]);
        await orderingService.CreateOrder(request, checkoutInfo.RequestId);
        await DeleteBasketAsync();
    }

    private async Task ChangeSavedItemsAsync(Func<Task> change)
    {
        try
        {
            await change();
        }
        catch (RpcException ex) when (ex.StatusCode == StatusCode.NotFound)
        {
            // The page was stale (another tab or a double submit already changed this product):
            // ignore it, like SetQuantityAsync ignores a missing row, and show the current basket.
        }

        _cachedBasket = null;
        await NotifyChangeSubscribersAsync();
    }

    private Task NotifyChangeSubscribersAsync()
        => Task.WhenAll(_changeSubscriptions.Select(s => s.NotifyAsync()));

    private async Task<ClaimsPrincipal> GetUserAsync()
        => (await authenticationStateProvider.GetAuthenticationStateAsync()).User;

    private async Task<IReadOnlyCollection<BasketItem>> FetchBasketItemsAsync()
        => (await FetchBasketAsync()).Items;

    private Task<(IReadOnlyCollection<BasketItem> Items, IReadOnlyCollection<BasketItem> SavedItems)> FetchBasketAsync()
    {
        return _cachedBasket ??= FetchCoreAsync();

        async Task<(IReadOnlyCollection<BasketItem> Items, IReadOnlyCollection<BasketItem> SavedItems)> FetchCoreAsync()
        {
            var contents = await basketService.GetBasketAsync();
            var quantities = contents.Items.Concat(contents.SavedItems).ToList();
            if (quantities.Count == 0)
            {
                return ([], []);
            }

            // Get details for the items in the basket and the saved products
            var productIds = quantities.Select(row => row.ProductId).Distinct();
            var catalogItems = (await catalogService.GetCatalogItems(productIds)).ToDictionary(k => k.Id, v => v);
            // Saved products are long-lived and may have left the catalog; skip those instead of breaking the cart
            return (
                ToBasketItems(contents.Items, catalogItems, skipMissing: false),
                ToBasketItems(contents.SavedItems, catalogItems, skipMissing: true));
        }
    }

    private static List<BasketItem> ToBasketItems(IEnumerable<BasketQuantity> quantities, Dictionary<int, CatalogItem> catalogItems, bool skipMissing)
    {
        var basketItems = new List<BasketItem>();
        foreach (var item in quantities)
        {
            if (!catalogItems.TryGetValue(item.ProductId, out var catalogItem))
            {
                if (skipMissing)
                {
                    continue;
                }

                throw new KeyNotFoundException($"Product {item.ProductId} is not in the catalog.");
            }

            var orderItem = new BasketItem
            {
                Id = Guid.NewGuid().ToString(), // TODO: this value is meaningless, use ProductId instead.
                ProductId = catalogItem.Id,
                ProductName = catalogItem.Name,
                UnitPrice = catalogItem.Price,
                Quantity = item.Quantity,
            };
            basketItems.Add(orderItem);
        }

        return basketItems;
    }

    private class BasketStateChangedSubscription(BasketState Owner, EventCallback Callback) : IDisposable
    {
        public Task NotifyAsync() => Callback.InvokeAsync();
        public void Dispose() => Owner._changeSubscriptions.Remove(this);
    }
}

public record CreateOrderRequest(
    string UserId,
    string UserName,
    string City,
    string Street,
    string State,
    string Country,
    string ZipCode,
    string CardNumber,
    string CardHolderName,
    DateTime CardExpiration,
    string CardSecurityNumber,
    int CardTypeId,
    string Buyer,
    List<BasketItem> Items);
