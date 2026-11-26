using eShop.Basket.API.Grpc;
using GrpcBasketItem = eShop.Basket.API.Grpc.BasketItem;
using GrpcBasketClient = eShop.Basket.API.Grpc.Basket.BasketClient;

namespace eShop.WebApp.Services;

public class BasketService(GrpcBasketClient basketClient)
{
    public async Task<BasketContents> GetBasketAsync()
    {
        var result = await basketClient.GetBasketAsync(new ());
        return new BasketContents(MapToQuantities(result.Items), MapToQuantities(result.SavedItems));
    }

    public async Task SaveForLaterAsync(int productId)
    {
        await basketClient.SaveForLaterAsync(new SaveForLaterRequest { ProductId = productId });
    }

    public async Task MoveToCartAsync(int productId)
    {
        await basketClient.MoveToCartAsync(new MoveToCartRequest { ProductId = productId });
    }

    public async Task RemoveSavedItemAsync(int productId)
    {
        await basketClient.RemoveSavedItemAsync(new RemoveSavedItemRequest { ProductId = productId });
    }

    public async Task DeleteBasketAsync()
    {
        await basketClient.DeleteBasketAsync(new DeleteBasketRequest());
    }

    public async Task UpdateBasketAsync(IReadOnlyCollection<BasketQuantity> basket)
    {
        var updatePayload = new UpdateBasketRequest();

        foreach (var item in basket)
        {
            var updateItem = new GrpcBasketItem
            {
                ProductId = item.ProductId,
                Quantity = item.Quantity,
            };
            updatePayload.Items.Add(updateItem);
        }

        await basketClient.UpdateBasketAsync(updatePayload);
    }

    private static List<BasketQuantity> MapToQuantities(IEnumerable<GrpcBasketItem> items)
    {
        var result = new List<BasketQuantity>();
        foreach (var item in items)
        {
            result.Add(new BasketQuantity(item.ProductId, item.Quantity));
        }

        return result;
    }
}

public record BasketQuantity(int ProductId, int Quantity);

public record BasketContents(IReadOnlyCollection<BasketQuantity> Items, IReadOnlyCollection<BasketQuantity> SavedItems);
