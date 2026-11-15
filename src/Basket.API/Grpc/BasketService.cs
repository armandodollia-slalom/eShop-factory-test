using System.Diagnostics.CodeAnalysis;
using eShop.Basket.API.Extensions;
using eShop.Basket.API.Model;
using eShop.Basket.API.Repositories;

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

    [DoesNotReturn]
    private static void ThrowNotAuthenticated() => throw new RpcException(new Status(StatusCode.Unauthenticated, "The caller is not authenticated."));

    [DoesNotReturn]
    private static void ThrowBasketDoesNotExist(string userId) => throw new RpcException(new Status(StatusCode.NotFound, $"Basket with buyer id {userId} does not exist"));

    [DoesNotReturn]
    private static void ThrowMergedQuantityOutOfRange(int productId) => throw new RpcException(new Status(StatusCode.InvalidArgument, $"The quantities listed for product {productId} add up to more than the largest quantity a basket line can hold."));

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

        return response;
    }

    private static CustomerBasket MapToCustomerBasket(string userId, UpdateBasketRequest customerBasketRequest)
    {
        var response = new CustomerBasket
        {
            BuyerId = userId
        };

        // A product listed more than once becomes one line holding the sum of its quantities,
        // kept at the position where the product first appears.
        var itemsByProductId = new Dictionary<int, Model.BasketItem>();
        foreach (var item in customerBasketRequest.Items)
        {
            if (itemsByProductId.TryGetValue(item.ProductId, out var existing))
            {
                var mergedQuantity = (long)existing.Quantity + item.Quantity;
                if (mergedQuantity > int.MaxValue || mergedQuantity < int.MinValue)
                {
                    ThrowMergedQuantityOutOfRange(item.ProductId);
                }

                existing.Quantity = (int)mergedQuantity;
                continue;
            }

            var basketItem = new Model.BasketItem
            {
                ProductId = item.ProductId,
                Quantity = item.Quantity,
            };
            itemsByProductId.Add(item.ProductId, basketItem);
            response.Items.Add(basketItem);
        }

        return response;
    }
}
