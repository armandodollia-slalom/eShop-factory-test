using System.Diagnostics.CodeAnalysis;
using eShop.Basket.API.Repositories;
using eShop.Basket.API.Extensions;
using eShop.Basket.API.Model;

namespace eShop.Basket.API.Grpc;

public class BasketService(
    IBasketRepository repository,
    ILogger<BasketService> logger) : Basket.BasketBase
{
    [AllowAnonymous]
    public override async Task<CustomerBasketResponse> GetBasket(GetBasketRequest request, ServerCallContext context)
    {
        var userId = context.GetUserIdentity();
        if (string.IsNullOrEmpty(userId))
        {
            return new();
        }

        if (logger.IsEnabled(LogLevel.Debug))
        {
            logger.LogDebug("Begin GetBasketById call from method {Method} for basket id {Id}", context.Method, userId);
        }

        var data = await repository.GetBasketAsync(userId);

        if (data is not null)
        {
            return MapToCustomerBasketResponse(data);
        }

        return new();
    }

    public override async Task<CustomerBasketResponse> UpdateBasket(UpdateBasketRequest request, ServerCallContext context)
    {
        var userId = context.GetUserIdentity();
        if (string.IsNullOrEmpty(userId))
        {
            ThrowNotAuthenticated();
        }

        if (logger.IsEnabled(LogLevel.Debug))
        {
            logger.LogDebug("Begin UpdateBasket call from method {Method} for basket id {Id}", context.Method, userId);
        }

        var customerBasket = MapToCustomerBasket(userId, request);
        customerBasket.SavedItems = (await repository.GetBasketAsync(userId))?.SavedItems ?? [];
        var response = await repository.UpdateBasketAsync(customerBasket);
        if (response is null)
        {
            ThrowBasketDoesNotExist(userId);
        }

        return MapToCustomerBasketResponse(response);
    }

    public override async Task<DeleteBasketResponse> DeleteBasket(DeleteBasketRequest request, ServerCallContext context)
    {
        var userId = context.GetUserIdentity();
        if (string.IsNullOrEmpty(userId))
        {
            ThrowNotAuthenticated();
        }

        await repository.DeleteBasketAsync(userId);
        return new();
    }

    public override Task<CustomerBasketResponse> SaveForLater(SaveForLaterRequest request, ServerCallContext context)
        => MoveProduct(request.ProductId, context, static basket => (basket.Items, basket.SavedItems), $"Product {request.ProductId} is not in the cart");

    public override Task<CustomerBasketResponse> MoveToCart(MoveToCartRequest request, ServerCallContext context)
        => MoveProduct(request.ProductId, context, static basket => (basket.SavedItems, basket.Items), $"Product {request.ProductId} is not saved for later");

    public override async Task<CustomerBasketResponse> RemoveSavedItem(RemoveSavedItemRequest request, ServerCallContext context)
    {
        var userId = GetRequiredUserId(context);
        var basket = await repository.GetBasketAsync(userId);

        var item = basket?.SavedItems.FirstOrDefault(i => i.ProductId == request.ProductId);
        if (item is null)
        {
            ThrowSavedItemNotFound(request.ProductId);
        }

        basket.SavedItems.Remove(item);
        return await PersistAsync(userId, basket);
    }

    private async Task<CustomerBasketResponse> MoveProduct(
        int productId,
        ServerCallContext context,
        Func<CustomerBasket, (List<Model.BasketItem> Source, List<Model.BasketItem> Target)> select,
        string notFoundMessage)
    {
        var userId = GetRequiredUserId(context);
        var basket = await repository.GetBasketAsync(userId);

        var (source, target) = basket is null ? default : select(basket);
        var item = source?.FirstOrDefault(i => i.ProductId == productId);
        if (item is null)
        {
            ThrowNotFound(notFoundMessage);
        }

        source.Remove(item);
        var existing = target.FirstOrDefault(i => i.ProductId == productId);
        if (existing is null)
        {
            target.Add(item);
        }
        else
        {
            existing.Quantity += item.Quantity;
        }

        return await PersistAsync(userId, basket);
    }

    private async Task<CustomerBasketResponse> PersistAsync(string userId, CustomerBasket basket)
    {
        var response = await repository.UpdateBasketAsync(basket);
        if (response is null)
        {
            ThrowBasketDoesNotExist(userId);
        }

        return MapToCustomerBasketResponse(response);
    }

    private static string GetRequiredUserId(ServerCallContext context)
    {
        var userId = context.GetUserIdentity();
        if (string.IsNullOrEmpty(userId))
        {
            ThrowNotAuthenticated();
        }

        return userId;
    }

    [DoesNotReturn]
    private static void ThrowNotFound(string message) => throw new RpcException(new Status(StatusCode.NotFound, message));

    [DoesNotReturn]
    private static void ThrowSavedItemNotFound(int productId) => ThrowNotFound($"Product {productId} is not saved for later");

    [DoesNotReturn]
    private static void ThrowNotAuthenticated() => throw new RpcException(new Status(StatusCode.Unauthenticated, "The caller is not authenticated."));

    [DoesNotReturn]
    private static void ThrowBasketDoesNotExist(string userId) => throw new RpcException(new Status(StatusCode.NotFound, $"Basket with buyer id {userId} does not exist"));

    private static CustomerBasketResponse MapToCustomerBasketResponse(CustomerBasket customerBasket)
    {
        var response = new CustomerBasketResponse();

        foreach (var item in customerBasket.Items)
        {
            response.Items.Add(new BasketItem()
            {
                ProductId = item.ProductId,
                Quantity = item.Quantity,
            });
        }

        foreach (var item in customerBasket.SavedItems)
        {
            response.SavedItems.Add(new BasketItem()
            {
                ProductId = item.ProductId,
                Quantity = item.Quantity,
            });
        }

        return response;
    }

    private static CustomerBasket MapToCustomerBasket(string userId, UpdateBasketRequest customerBasketRequest)
    {
        var response = new CustomerBasket
        {
            BuyerId = userId
        };

        foreach (var item in customerBasketRequest.Items)
        {
            response.Items.Add(new()
            {
                ProductId = item.ProductId,
                Quantity = item.Quantity,
            });
        }

        return response;
    }
}
