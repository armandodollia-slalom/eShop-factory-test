namespace eShop.Basket.FunctionalTests;

public sealed class RedisBasketRepositoryTests(RedisFixture fixture) : IClassFixture<RedisFixture>
{
    [Fact]
    public async Task UpdateGetAndDeleteRoundTrip()
    {
        var repository = new RedisBasketRepository(
            NullLogger<RedisBasketRepository>.Instance,
            fixture.Connection);
        var buyerId = $"buyer-{Guid.NewGuid():N}";
        var basket = new CustomerBasket
        {
            BuyerId = buyerId,
            Items =
            [
                new BasketItem
                {
                    ProductId = 42,
                    Quantity = 3,
                    ProductName = "Test product",
                    UnitPrice = 12.50m
                }
            ]
        };

        var updated = await repository.UpdateBasketAsync(basket);
        var loaded = await repository.GetBasketAsync(buyerId);
        var deleted = await repository.DeleteBasketAsync(buyerId);
        var afterDelete = await repository.GetBasketAsync(buyerId);

        Assert.NotNull(updated);
        Assert.NotNull(loaded);
        Assert.Equal(42, loaded.Items.Single().ProductId);
        Assert.Equal(3, loaded.Items.Single().Quantity);
        Assert.True(deleted);
        Assert.Null(afterDelete);
    }

    [Fact]
    public async Task ConditionalUpdateRetriesAgainstBasketWrittenConcurrently()
    {
        var repository = new RedisBasketRepository(
            NullLogger<RedisBasketRepository>.Instance,
            fixture.Connection);
        var buyerId = $"buyer-{Guid.NewGuid():N}";
        var originallyAdded = new DateTime(2026, 11, 1, 9, 0, 0, DateTimeKind.Utc);
        var reAdded = new DateTime(2026, 11, 3, 15, 30, 0, DateTimeKind.Utc);
        await repository.UpdateBasketAsync(new CustomerBasket(buyerId)
        {
            Items = [new BasketItem { ProductId = 42, Quantity = 1, AddedAt = originallyAdded }]
        });
        var seen = new List<DateTime?>();

        var updated = await repository.UpdateBasketAsync(buyerId, stored =>
        {
            seen.Add(stored.Items.Single().AddedAt);
            if (seen.Count == 1)
            {
                // Another request removes and re-adds the product between this read and the write.
                repository.UpdateBasketAsync(new CustomerBasket(buyerId)
                {
                    Items = [new BasketItem { ProductId = 42, Quantity = 1, AddedAt = reAdded }]
                }).GetAwaiter().GetResult();
            }

            return new CustomerBasket(buyerId)
            {
                Items = [new BasketItem { ProductId = 42, Quantity = 5, AddedAt = stored.Items.Single().AddedAt }]
            };
        });
        var loaded = await repository.GetBasketAsync(buyerId);

        Assert.Equal([originallyAdded, reAdded], seen);
        Assert.NotNull(updated);
        Assert.Equal(5, loaded.Items.Single().Quantity);
        Assert.Equal(reAdded, loaded.Items.Single().AddedAt);
        await repository.DeleteBasketAsync(buyerId);
    }

    [Fact]
    public async Task ConditionalUpdateThrowsConcurrencyExceptionWhenEveryAttemptConflicts()
    {
        var repository = new RedisBasketRepository(
            NullLogger<RedisBasketRepository>.Instance,
            fixture.Connection);
        var buyerId = $"buyer-{Guid.NewGuid():N}";
        await repository.UpdateBasketAsync(new CustomerBasket(buyerId)
        {
            Items = [new BasketItem { ProductId = 42, Quantity = 1 }]
        });
        var attempts = 0;

        await Assert.ThrowsAsync<BasketConcurrencyException>(() => repository.UpdateBasketAsync(buyerId, stored =>
        {
            attempts++;
            // Another request changes the basket between every read and write.
            repository.UpdateBasketAsync(new CustomerBasket(buyerId)
            {
                Items = [new BasketItem { ProductId = 42, Quantity = attempts + 1 }]
            }).GetAwaiter().GetResult();

            return new CustomerBasket(buyerId)
            {
                Items = [new BasketItem { ProductId = 42, Quantity = 100 }]
            };
        }));
        var loaded = await repository.GetBasketAsync(buyerId);

        Assert.Equal(10, attempts);
        Assert.NotNull(loaded);
        Assert.Equal(11, loaded.Items.Single().Quantity);
        await repository.DeleteBasketAsync(buyerId);
    }

    [Fact]
    public async Task MissingBasketReturnsNullAndDeleteReturnsFalse()
    {
        var repository = new RedisBasketRepository(
            NullLogger<RedisBasketRepository>.Instance,
            fixture.Connection);
        var buyerId = $"missing-{Guid.NewGuid():N}";

        Assert.Null(await repository.GetBasketAsync(buyerId));
        Assert.False(await repository.DeleteBasketAsync(buyerId));
    }
}
