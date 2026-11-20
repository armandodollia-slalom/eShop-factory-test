using System.Diagnostics.CodeAnalysis;
using eShop.Basket.API.Extensions;
using eShop.Basket.API.Model;
using eShop.Basket.API.Repositories;
using Google.Protobuf.WellKnownTypes;

namespace eShop.Basket.API.Grpc;

public class BasketService(
    IBasketRepository repository,
    ILogger<BasketService> logger,
    TimeProvider timeProvider) : Basket.BasketBase
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

        var utcNow = timeProvider.GetUtcNow().UtcDateTime;
        CustomerBasket response;
        try
        {
            response = await repository.UpdateBasketAsync(userId, storedBasket => MapToCustomerBasket(userId, request, storedBasket, utcNow));
        }
        catch (BasketConcurrencyException)
        {
            throw new RpcException(new Status(StatusCode.Aborted, "The basket was changed concurrently; retry the update."));
        }

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

    private static CustomerBasketResponse MapToCustomerBasketResponse(CustomerBasket customerBasket)
    {
        var response = new CustomerBasketResponse();

        foreach (var item in customerBasket.Items)
        {
            var responseItem = new BasketItem()
            {
                ProductId = item.ProductId,
                Quantity = item.Quantity,
            };

            if (item.AddedAt is { } addedAt)
            {
                responseItem.AddedAt = Timestamp.FromDateTime(DateTime.SpecifyKind(addedAt, DateTimeKind.Utc));
            }

            response.Items.Add(responseItem);
        }

        return response;
    }

    private static CustomerBasket MapToCustomerBasket(string userId, UpdateBasketRequest customerBasketRequest, CustomerBasket storedBasket, DateTime utcNow)
    {
        var response = new CustomerBasket
        {
            BuyerId = userId
        };

        // The server owns when a product was first added; the client's added_at is never trusted.
        var storedAddedAt = new Dictionary<int, DateTime?>();
        foreach (var storedItem in storedBasket?.Items ?? [])
        {
            storedAddedAt.TryAdd(storedItem.ProductId, storedItem.AddedAt);
        }

        foreach (var item in customerBasketRequest.Items)
        {
            response.Items.Add(new()
            {
                ProductId = item.ProductId,
                Quantity = item.Quantity,
                AddedAt = storedAddedAt.TryGetValue(item.ProductId, out var addedAt) ? addedAt : utcNow,
            });
        }

        return response;
    }
}
