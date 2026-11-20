using System.Text.Json.Serialization;
using eShop.Basket.API.Model;

namespace eShop.Basket.API.Repositories;

public class RedisBasketRepository(ILogger<RedisBasketRepository> logger, IConnectionMultiplexer redis) : IBasketRepository
{
    private readonly IDatabase _database = redis.GetDatabase();

    // implementation:

    // - /basket/{id} "string" per unique basket
    private static RedisKey BasketKeyPrefix = "/basket/"u8.ToArray();
    // note on UTF8 here: library limitation (to be fixed) - prefixes are more efficient as blobs

    private static RedisKey GetBasketKey(string userId) => BasketKeyPrefix.Append(userId);

    public async Task<bool> DeleteBasketAsync(string id)
    {
        return await _database.KeyDeleteAsync(GetBasketKey(id));
    }

    public async Task<CustomerBasket> GetBasketAsync(string customerId)
    {
        using var data = await _database.StringGetLeaseAsync(GetBasketKey(customerId));

        if (data is null || data.Length == 0)
        {
            return null;
        }
        return JsonSerializer.Deserialize(data.Span, BasketSerializationContext.Default.CustomerBasket);
    }

    public async Task<CustomerBasket> UpdateBasketAsync(CustomerBasket basket)
    {
        var json = JsonSerializer.SerializeToUtf8Bytes(basket, BasketSerializationContext.Default.CustomerBasket);
        var created = await _database.StringSetAsync(GetBasketKey(basket.BuyerId), json);

        if (!created)
        {
            logger.LogInformation("Problem occurred persisting the item.");
            return null;
        }


        logger.LogInformation("Basket item persisted successfully.");
        return await GetBasketAsync(basket.BuyerId);
    }

    public async Task<CustomerBasket> UpdateBasketAsync(string buyerId, Func<CustomerBasket, CustomerBasket> update)
    {
        var key = GetBasketKey(buyerId);

        for (var attempt = 0; attempt < MaxConditionalUpdateAttempts; attempt++)
        {
            var stored = await _database.StringGetAsync(key);
            var storedBasket = stored.IsNullOrEmpty
                ? null
                : JsonSerializer.Deserialize((byte[])stored, BasketSerializationContext.Default.CustomerBasket);
            var json = JsonSerializer.SerializeToUtf8Bytes(update(storedBasket), BasketSerializationContext.Default.CustomerBasket);

            // The write only lands if nobody changed the basket since it was read; otherwise re-read and recompute.
            var transaction = _database.CreateTransaction();
            transaction.AddCondition(stored.IsNull ? Condition.KeyNotExists(key) : Condition.StringEqual(key, stored));
            _ = transaction.StringSetAsync(key, json);

            if (await transaction.ExecuteAsync())
            {
                logger.LogInformation("Basket item persisted successfully.");
                return await GetBasketAsync(buyerId);
            }
        }

        logger.LogWarning("Basket {BuyerId} kept changing concurrently; update abandoned after {Attempts} attempts.", buyerId, MaxConditionalUpdateAttempts);
        return null;
    }

    private const int MaxConditionalUpdateAttempts = 10;
}

[JsonSerializable(typeof(CustomerBasket))]
[JsonSourceGenerationOptions(PropertyNameCaseInsensitive = true)]
public partial class BasketSerializationContext : JsonSerializerContext
{

}
