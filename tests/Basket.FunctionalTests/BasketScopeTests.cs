using Grpc.Core;
using DeleteBasketResponse = eShop.Basket.API.Grpc.DeleteBasketResponse;

namespace eShop.Basket.FunctionalTests;

// BUG-6: Basket.API must refuse UpdateBasket and DeleteBasket for callers whose token lacks the basket scope,
// before the handler touches Redis; basket-scoped callers and anonymous GetBasket keep working.
[Collection(BasketApiCollection.Name)]
[Trait("Story", "BUG-6")]
public sealed class BasketScopeTests(BasketApiFixture fixture)
{
    private const int SeededProductId = 1;
    private const int SeededQuantity = 1;
    private const int RequestedProductId = 99;

    private readonly BasketGrpcClient _client = new(fixture.CreateChannel());

    [Fact]
    [Trait("TestCase", "TC-BUG-6-03")]
    public async Task TC_BUG_6_03_UpdateBasketWithOrdersScopeOnlyIsDeniedAndRedisIsUnchanged()
    {
        const string buyerId = "user-bug6-03";
        await SeedBasketAsync(buyerId);

        var error = await Assert.ThrowsAsync<RpcException>(() => _client.UpdateBasketAsync(RequestedProductId, 5, buyerId, "orders"));

        Assert.Equal(StatusCode.PermissionDenied, error.StatusCode);
        await AssertOnlySeededItemAsync(buyerId);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-6-04")]
    public async Task TC_BUG_6_04_UpdateBasketWithoutScopeClaimIsDenied()
    {
        const string buyerId = "user-bug6-04";
        await fixture.Repository.DeleteBasketAsync(buyerId);

        var error = await Assert.ThrowsAsync<RpcException>(() => _client.UpdateBasketAsync(RequestedProductId, 1, buyerId));

        Assert.Equal(StatusCode.PermissionDenied, error.StatusCode);
        Assert.Null(await fixture.Repository.GetBasketAsync(buyerId));
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-6-05")]
    public async Task TC_BUG_6_05_DeleteBasketWithOrdersScopeOnlyIsDeniedAndBasketStays()
    {
        const string buyerId = "user-bug6-05";
        await SeedBasketAsync(buyerId);

        var error = await Assert.ThrowsAsync<RpcException>(() => _client.DeleteBasketAsync(buyerId, "orders"));

        Assert.Equal(StatusCode.PermissionDenied, error.StatusCode);
        await AssertOnlySeededItemAsync(buyerId);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-6-06")]
    public async Task TC_BUG_6_06_UpdateBasketWithOneScopeClaimPerScopeIncludingBasketSucceeds()
    {
        const string buyerId = "user-bug6-06";
        const int quantity = 2;
        await fixture.Repository.DeleteBasketAsync(buyerId);

        var response = await _client.UpdateBasketAsync(RequestedProductId, quantity, buyerId, "openid", "orders", "basket");

        var item = Assert.Single(response.Items);
        Assert.Equal(RequestedProductId, item.ProductId);
        Assert.Equal(quantity, item.Quantity);
        var stored = await fixture.Repository.GetBasketAsync(buyerId);
        Assert.NotNull(stored);
        Assert.Equal(buyerId, stored.BuyerId);
        var storedItem = Assert.Single(stored.Items);
        Assert.Equal(RequestedProductId, storedItem.ProductId);
        Assert.Equal(quantity, storedItem.Quantity);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-6-07")]
    public async Task TC_BUG_6_07_UpdateBasketWithSpaceSeparatedScopeIncludingBasketSucceeds()
    {
        const string buyerId = "user-bug6-07";
        const int quantity = 3;
        await fixture.Repository.DeleteBasketAsync(buyerId);

        var response = await _client.UpdateBasketAsync(RequestedProductId, quantity, buyerId, "openid orders basket");

        var item = Assert.Single(response.Items);
        Assert.Equal(RequestedProductId, item.ProductId);
        Assert.Equal(quantity, item.Quantity);
        var stored = await fixture.Repository.GetBasketAsync(buyerId);
        Assert.NotNull(stored);
        var storedItem = Assert.Single(stored.Items);
        Assert.Equal(RequestedProductId, storedItem.ProductId);
        Assert.Equal(quantity, storedItem.Quantity);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-6-08")]
    public async Task TC_BUG_6_08_ScopeBasketsDoesNotSatisfyBasketScope()
    {
        const string buyerId = "user-bug6-08";
        await fixture.Repository.DeleteBasketAsync(buyerId);

        var error = await Assert.ThrowsAsync<RpcException>(() => _client.UpdateBasketAsync(RequestedProductId, 1, buyerId, "openid baskets"));

        Assert.Equal(StatusCode.PermissionDenied, error.StatusCode);
        Assert.Null(await fixture.Repository.GetBasketAsync(buyerId));
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-6-09")]
    public async Task TC_BUG_6_09_UpdateBasketWithoutTokenIsUnauthenticated()
    {
        var keysBefore = CountBasketKeys();

        var error = await Assert.ThrowsAsync<RpcException>(() => _client.UpdateBasketAsync(RequestedProductId, 1, subject: null));

        Assert.Equal(StatusCode.Unauthenticated, error.StatusCode);
        Assert.Equal(keysBefore, CountBasketKeys());
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-6-10")]
    public async Task TC_BUG_6_10_DeleteBasketWithBasketScopeRemovesBasket()
    {
        const string buyerId = "user-bug6-10";
        await SeedBasketAsync(buyerId);

        var response = await _client.DeleteBasketAsync(buyerId, "basket");

        Assert.Equal(new DeleteBasketResponse(), response);
        Assert.Null(await fixture.Repository.GetBasketAsync(buyerId));
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-6-11")]
    public async Task TC_BUG_6_11_AnonymousGetBasketReturnsEmptyBasket()
    {
        var response = await _client.GetBasketAsync(subject: null);

        Assert.Empty(response.Items);
    }

    private async Task SeedBasketAsync(string buyerId)
    {
        var seeded = await fixture.Repository.UpdateBasketAsync(new CustomerBasket
        {
            BuyerId = buyerId,
            Items = [new BasketItem { ProductId = SeededProductId, Quantity = SeededQuantity }]
        });
        Assert.NotNull(seeded);
    }

    private async Task AssertOnlySeededItemAsync(string buyerId)
    {
        var stored = await fixture.Repository.GetBasketAsync(buyerId);
        Assert.NotNull(stored);
        var item = Assert.Single(stored.Items);
        Assert.Equal(SeededProductId, item.ProductId);
        Assert.Equal(SeededQuantity, item.Quantity);
        Assert.DoesNotContain(stored.Items, i => i.ProductId == RequestedProductId);
    }

    private int CountBasketKeys()
    {
        var endpoint = fixture.Redis.Connection.GetEndPoints().Single();
        return fixture.Redis.Connection.GetServer(endpoint).Keys(pattern: "/basket/*").Count();
    }
}
