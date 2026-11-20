using System.Collections.Concurrent;

namespace eShop.Basket.FunctionalTests;

/// <summary>
/// The hosted Basket API's repository in the functional tests: every member delegates to the real
/// <see cref="RedisBasketRepository"/> (<see cref="Inner"/>). For a buyer registered with <see cref="Intercept"/>,
/// the conditional <c>UpdateBasketAsync(buyerId, update)</c> passes the inner repository a wrapped update function
/// that, on each call, records the stored basket it was given and first writes the interceptor's concurrent basket
/// for that buyer, so the inner repository's write conflicts deterministically.
/// </summary>
public sealed class InterceptingBasketRepository(RedisBasketRepository inner) : IBasketRepository
{
    private readonly ConcurrentDictionary<string, ConcurrentWriteInterceptor> _interceptors = new();

    public RedisBasketRepository Inner { get; } = inner;

    public ConcurrentWriteInterceptor Intercept(string buyerId, Func<int, CustomerBasket?> concurrentBasketForCall)
    {
        var interceptor = new ConcurrentWriteInterceptor(concurrentBasketForCall);
        _interceptors[buyerId] = interceptor;
        return interceptor;
    }

    public Task<CustomerBasket> GetBasketAsync(string customerId) => Inner.GetBasketAsync(customerId);

    public Task<CustomerBasket> UpdateBasketAsync(CustomerBasket basket) => Inner.UpdateBasketAsync(basket);

    public Task<bool> DeleteBasketAsync(string id) => Inner.DeleteBasketAsync(id);

    public async Task<CustomerBasket> UpdateBasketAsync(string buyerId, Func<CustomerBasket, CustomerBasket> update)
    {
        if (!_interceptors.TryGetValue(buyerId, out var interceptor))
        {
            return await Inner.UpdateBasketAsync(buyerId, update);
        }

        try
        {
            var result = await Inner.UpdateBasketAsync(buyerId, stored =>
            {
                interceptor.Calls++;
                interceptor.StoredAddedAt.Add(stored?.Items.FirstOrDefault()?.AddedAt);
                if (interceptor.ConcurrentBasketForCall(interceptor.Calls) is { } concurrent)
                {
                    // The update function is synchronous; the concurrent write must land before it returns.
                    Inner.UpdateBasketAsync(concurrent).GetAwaiter().GetResult();
                }

                return update(stored!);
            });
            interceptor.Returned = true;
            return result;
        }
        catch (Exception exception)
        {
            interceptor.Thrown = exception;
            throw;
        }
    }
}

/// <summary>What the wrapped update function saw for one buyer, and how the inner repository ended.</summary>
public sealed class ConcurrentWriteInterceptor(Func<int, CustomerBasket?> concurrentBasketForCall)
{
    /// <summary>Given the 1-based call number, the basket a concurrent request writes before the update returns, or null.</summary>
    public Func<int, CustomerBasket?> ConcurrentBasketForCall { get; } = concurrentBasketForCall;

    public int Calls { get; set; }

    /// <summary>The AddedAt of the first stored line passed to each call of the update function.</summary>
    public List<DateTime?> StoredAddedAt { get; } = [];

    public bool Returned { get; set; }

    public Exception? Thrown { get; set; }
}
