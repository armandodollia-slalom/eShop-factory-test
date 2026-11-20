using System.Globalization;
using System.Text.Json;
using eShop.Basket.API.Grpc;
using Google.Protobuf.WellKnownTypes;
using Grpc.Core;
using BasketItem = eShop.Basket.API.Model.BasketItem;
using GrpcBasketItem = eShop.Basket.API.Grpc.BasketItem;

namespace eShop.Basket.FunctionalTests;

// ADDED-1: the Basket API keeps the UTC time each product was first added (added_at) in Redis and returns it over
// gRPC; baskets stored before the change load without it.
[Trait("Story", "ADDED-1")]
[Collection(BasketApiCollection.Name)]
public sealed class BasketAddedAtTests(BasketApiFixture fixture)
{
    private static readonly DateTime FirstAdded = new(2026, 11, 1, 9, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime AddedAgain = new(2026, 11, 20, 10, 0, 0, DateTimeKind.Utc);
    private static readonly DateTimeOffset ClockAfterRace = new(2026, 11, 25, 8, 0, 0, TimeSpan.Zero);

    private static string NewBuyerId() => $"buyer-{Guid.NewGuid():N}";

    private static RedisKey BasketKey(string buyerId) => $"/basket/{buyerId}";

    private static UpdateBasketRequest Request(int productId, int quantity)
    {
        var request = new UpdateBasketRequest();
        request.Items.Add(new GrpcBasketItem { ProductId = productId, Quantity = quantity });
        return request;
    }

    private static CustomerBasket StoredBasket(string buyerId, int quantity, DateTime addedAt) =>
        new(buyerId) { Items = [new BasketItem { ProductId = 99, Quantity = quantity, AddedAt = addedAt }] };

    [Fact]
    [Trait("TestCase", "TC-ADDED-1-12")]
    public async Task TC_ADDED_1_12_GetBasketLoadsBasketJsonStoredBeforeTheChangeWithNoAddedAt()
    {
        var buyerId = NewBuyerId();
        var legacyJson = $$"""{"BuyerId":"{{buyerId}}","Items":[{"Id":"1","ProductId":99,"ProductName":"Adventurer GPS Watch","UnitPrice":49.99,"OldUnitPrice":0,"Quantity":2,"PictureUrl":""}]}""";
        var database = fixture.Connection.GetDatabase();
        await database.StringSetAsync(BasketKey(buyerId), legacyJson);
        fixture.Clock.UtcNow = new DateTimeOffset(2026, 11, 20, 10, 0, 0, TimeSpan.Zero);
        using var client = fixture.CreateBasketClient(buyerId);

        var response = await client.GetBasketAsync(new GetBasketRequest());
        var rawAfter = await database.StringGetAsync(BasketKey(buyerId));

        var item = Assert.Single(response.Items);
        Assert.Equal(99, item.ProductId);
        Assert.Equal(2, item.Quantity);
        Assert.Null(item.AddedAt);
        Assert.Equal(legacyJson, rawAfter.ToString());
        await database.KeyDeleteAsync(BasketKey(buyerId));
    }

    [Fact]
    [Trait("TestCase", "TC-ADDED-1-13")]
    public async Task TC_ADDED_1_13_UpdateBasketPersistsServerAssignedAddedAtAndGetBasketReturnsItExactly()
    {
        var buyerId = NewBuyerId();
        var now = new DateTimeOffset(2026, 11, 1, 9, 0, 0, 123, TimeSpan.Zero);
        var expected = Timestamp.FromDateTimeOffset(now);
        var database = fixture.Connection.GetDatabase();
        Assert.False(await database.KeyExistsAsync(BasketKey(buyerId)));
        fixture.Clock.UtcNow = now;
        using var client = fixture.CreateBasketClient(buyerId);

        var updated = await client.UpdateBasketAsync(Request(99, 1));
        var loaded = await client.GetBasketAsync(new GetBasketRequest());
        var rawJson = await database.StringGetAsync(BasketKey(buyerId));

        var updatedItem = Assert.Single(updated.Items);
        Assert.Equal(99, updatedItem.ProductId);
        Assert.Equal(expected, updatedItem.AddedAt);
        var loadedItem = Assert.Single(loaded.Items);
        Assert.Equal(99, loadedItem.ProductId);
        Assert.Equal(1, loadedItem.Quantity);
        Assert.Equal(expected.Seconds, loadedItem.AddedAt.Seconds);
        Assert.Equal(expected.Nanos, loadedItem.AddedAt.Nanos);
        using var stored = JsonDocument.Parse(rawJson.ToString());
        var storedItem = Assert.Single(stored.RootElement.GetProperty("Items").EnumerateArray());
        Assert.Equal(99, storedItem.GetProperty("ProductId").GetInt32());
        var storedAddedAt = DateTimeOffset.Parse(storedItem.GetProperty("AddedAt").GetString()!, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind);
        Assert.Equal(now, storedAddedAt);
        Assert.Equal(TimeSpan.Zero, storedAddedAt.Offset);
        await database.KeyDeleteAsync(BasketKey(buyerId));
    }

    [Fact]
    [Trait("TestCase", "TC-ADDED-1-16")]
    public async Task TC_ADDED_1_16_UpdateBasketRetriesAgainstBasketWrittenBetweenReadAndWriteAndKeepsNewDate()
    {
        var buyerId = NewBuyerId();
        fixture.Clock.UtcNow = ClockAfterRace;
        await fixture.Repository.Inner.UpdateBasketAsync(StoredBasket(buyerId, 1, FirstAdded));
        // Between the first read and its write, a concurrent request removes product 99 and adds it again.
        var interceptor = fixture.Repository.Intercept(buyerId, call => call == 1 ? StoredBasket(buyerId, 1, AddedAgain) : null);
        using var client = fixture.CreateBasketClient(buyerId);

        var updated = await client.UpdateBasketAsync(Request(99, 3));
        var loaded = await client.GetBasketAsync(new GetBasketRequest());

        Assert.Equal(2, interceptor.Calls);
        Assert.Equal([FirstAdded, AddedAgain], interceptor.StoredAddedAt);
        Assert.True(interceptor.Returned);
        Assert.Null(interceptor.Thrown);
        foreach (var response in new[] { updated, loaded })
        {
            var item = Assert.Single(response.Items);
            Assert.Equal(99, item.ProductId);
            Assert.Equal(3, item.Quantity);
            Assert.Equal(Timestamp.FromDateTime(AddedAgain), item.AddedAt);
            Assert.NotEqual(Timestamp.FromDateTime(FirstAdded), item.AddedAt);
            Assert.NotEqual(Timestamp.FromDateTimeOffset(ClockAfterRace), item.AddedAt);
        }

        await fixture.Repository.Inner.DeleteBasketAsync(buyerId);
    }

    [Fact]
    [Trait("TestCase", "TC-ADDED-1-18")]
    public async Task TC_ADDED_1_18_UpdateBasketReturnsAbortedAfterTenConflictingAttemptsAndLeavesConcurrentBasket()
    {
        var buyerId = NewBuyerId();
        fixture.Clock.UtcNow = ClockAfterRace;
        await fixture.Repository.Inner.UpdateBasketAsync(StoredBasket(buyerId, 1, FirstAdded));
        // Before every write, a concurrent request writes product 99 with quantity N + 1 on call N.
        var interceptor = fixture.Repository.Intercept(buyerId, call => StoredBasket(buyerId, call + 1, AddedAgain));
        using var client = fixture.CreateBasketClient(buyerId);

        var exception = await Assert.ThrowsAsync<RpcException>(() => client.UpdateBasketAsync(Request(99, 100)));
        var loaded = await client.GetBasketAsync(new GetBasketRequest());

        Assert.Equal(10, interceptor.Calls);
        Assert.IsType<BasketConcurrencyException>(interceptor.Thrown);
        Assert.False(interceptor.Returned);
        Assert.Equal(StatusCode.Aborted, exception.StatusCode);
        Assert.NotEqual(StatusCode.NotFound, exception.StatusCode);
        var item = Assert.Single(loaded.Items);
        Assert.Equal(99, item.ProductId);
        Assert.Equal(11, item.Quantity);
        Assert.Equal(Timestamp.FromDateTime(AddedAgain), item.AddedAt);
        Assert.NotEqual(100, item.Quantity);
        Assert.NotEqual(Timestamp.FromDateTime(FirstAdded), item.AddedAt);
        Assert.NotEqual(Timestamp.FromDateTimeOffset(ClockAfterRace), item.AddedAt);
        await fixture.Repository.Inner.DeleteBasketAsync(buyerId);
    }
}
