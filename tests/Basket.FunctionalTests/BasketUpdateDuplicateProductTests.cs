using eShop.Basket.API.Grpc;
using Grpc.Core;
using GrpcBasketItem = eShop.Basket.API.Grpc.BasketItem;
using ModelBasketItem = eShop.Basket.API.Model.BasketItem;

namespace eShop.Basket.FunctionalTests;

/// <summary>
/// BUG-33: an UpdateBasket request that lists a product more than once is stored as one line per product, holding the
/// sum of its quantities. <see cref="BasketService"/> runs over the real <see cref="RedisBasketRepository"/> on the
/// collection's Redis; each case uses its own buyer ids.
/// </summary>
[Collection(RedisCollection.Name)]
[Trait("Story", "BUG-33")]
public sealed class BasketUpdateDuplicateProductTests(RedisFixture fixture)
{
    private const int Product1 = 1;
    private const int Product2 = 2;

    private readonly RedisBasketRepository _repository = new(NullLogger<RedisBasketRepository>.Instance, fixture.Connection);

    private BasketService CreateService() => new(_repository, NullLogger<BasketService>.Instance);

    private static ServerCallContext ContextFor(string? buyerId) =>
        TestServerCallContext.ForUser(buyerId, TestContext.Current.CancellationToken);

    private static UpdateBasketRequest UpdateRequest(params (int ProductId, int Quantity)[] items)
    {
        var request = new UpdateBasketRequest();
        foreach (var (productId, quantity) in items)
        {
            request.Items.Add(new GrpcBasketItem { ProductId = productId, Quantity = quantity });
        }

        return request;
    }

    private static (int ProductId, int Quantity)[] Lines(CustomerBasketResponse response) =>
        [.. response.Items.Select(item => (item.ProductId, item.Quantity))];

    private async Task<BasketService> StartWithNoBasketAsync(string buyerId)
    {
        await _repository.DeleteBasketAsync(buyerId);
        return CreateService();
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-33-01")]
    public async Task TC_BUG_33_01_GetBasketAfterProduct1ListedTwiceReturnsOneLineWithQuantity3()
    {
        const string buyerId = "bug33-tc01-bob";
        var service = await StartWithNoBasketAsync(buyerId);
        var context = ContextFor(buyerId);

        // Step 1 completes without an RpcException.
        await service.UpdateBasket(UpdateRequest((Product1, 1), (Product1, 2)), context);

        var response = await service.GetBasket(new GetBasketRequest(), context);

        var line = Assert.Single(response.Items);
        Assert.Equal(Product1, line.ProductId);
        Assert.Equal(3, line.Quantity);
        Assert.DoesNotContain(response.Items, item => item.ProductId == Product1 && (item.Quantity == 1 || item.Quantity == 2));

        var stored = await _repository.GetBasketAsync(buyerId);
        Assert.NotNull(stored);
        var storedLine = Assert.Single(stored.Items);
        Assert.Equal(Product1, storedLine.ProductId);
        Assert.Equal(3, storedLine.Quantity);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-33-02")]
    public async Task TC_BUG_33_02_UpdateBasketResponseForProduct1ListedTwiceHoldsOneLineWithQuantity3()
    {
        const string buyerId = "bug33-tc02-bob";
        var service = await StartWithNoBasketAsync(buyerId);

        var response = await service.UpdateBasket(UpdateRequest((Product1, 1), (Product1, 2)), ContextFor(buyerId));

        var line = Assert.Single(response.Items);
        Assert.Equal(Product1, line.ProductId);
        Assert.Equal(3, line.Quantity);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-33-03")]
    public async Task TC_BUG_33_03_Product1ListedThreeTimesIsStoredAsOneLineWithQuantity3()
    {
        const string buyerId = "bug33-tc03-bob";
        var service = await StartWithNoBasketAsync(buyerId);
        var context = ContextFor(buyerId);

        await service.UpdateBasket(UpdateRequest((Product1, 1), (Product1, 1), (Product1, 1)), context);
        var response = await service.GetBasket(new GetBasketRequest(), context);

        var line = Assert.Single(response.Items);
        Assert.Equal(Product1, line.ProductId);
        Assert.Equal(3, line.Quantity);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-33-04")]
    public async Task TC_BUG_33_04_DuplicatedProductMergesWhileProductListedOnceKeepsItsLine()
    {
        const string buyerId = "bug33-tc04-bob";
        var service = await StartWithNoBasketAsync(buyerId);
        var context = ContextFor(buyerId);

        await service.UpdateBasket(UpdateRequest((Product1, 1), (Product2, 4), (Product1, 2)), context);
        var response = await service.GetBasket(new GetBasketRequest(), context);

        Assert.Equal(2, response.Items.Count);
        Assert.Equivalent(new[] { (Product1, 3), (Product2, 4) }, Lines(response), strict: true);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-33-05")]
    public async Task TC_BUG_33_05_UpdateListingEachProductOnceStoresOneLinePerEntry()
    {
        const string buyerId = "bug33-tc05-bob";
        var service = await StartWithNoBasketAsync(buyerId);
        var context = ContextFor(buyerId);

        await service.UpdateBasket(UpdateRequest((Product1, 1), (Product2, 4)), context);
        var response = await service.GetBasket(new GetBasketRequest(), context);

        Assert.Equal(2, response.Items.Count);
        Assert.Equivalent(new[] { (Product1, 1), (Product2, 4) }, Lines(response), strict: true);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-33-06")]
    public async Task TC_BUG_33_06_LaterUpdateReplacesMergedBasket()
    {
        const string buyerId = "bug33-tc06-bob";
        var service = await StartWithNoBasketAsync(buyerId);
        var context = ContextFor(buyerId);

        await service.UpdateBasket(UpdateRequest((Product1, 1), (Product1, 2)), context);
        await service.UpdateBasket(UpdateRequest((Product1, 5)), context);
        var response = await service.GetBasket(new GetBasketRequest(), context);

        var line = Assert.Single(response.Items);
        Assert.Equal(Product1, line.ProductId);
        Assert.Equal(5, line.Quantity);
    }

    [Fact]
    public async Task UpdateBasketWhoseDuplicateQuantitiesSumPastIntMaxIsRejectedAndLeavesStoredBasketUnchanged()
    {
        const string buyerId = "bug33-overflow-bob";
        var service = await StartWithNoBasketAsync(buyerId);
        var context = ContextFor(buyerId);
        await service.UpdateBasket(UpdateRequest((Product2, 4)), context);

        var exception = await Assert.ThrowsAsync<RpcException>(() =>
            service.UpdateBasket(UpdateRequest((Product1, 2_000_000_000), (Product1, 2_000_000_000)), context));

        Assert.Equal(StatusCode.InvalidArgument, exception.StatusCode);
        var stored = await _repository.GetBasketAsync(buyerId);
        Assert.NotNull(stored);
        var storedLine = Assert.Single(stored.Items);
        Assert.Equal(Product2, storedLine.ProductId);
        Assert.Equal(4, storedLine.Quantity);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-33-08")]
    public async Task TC_BUG_33_08_AnonymousUpdateListingProduct1TwiceIsRefusedAndStoresNothing()
    {
        const string anonymousBuyerId = "";
        var service = await StartWithNoBasketAsync(anonymousBuyerId);

        var exception = await Assert.ThrowsAsync<RpcException>(() =>
            service.UpdateBasket(UpdateRequest((Product1, 1), (Product1, 2)), ContextFor(null)));

        Assert.Equal(StatusCode.Unauthenticated, exception.StatusCode);
        Assert.Equal("The caller is not authenticated.", exception.Status.Detail);
        Assert.Null(await _repository.GetBasketAsync(anonymousBuyerId));
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-33-09")]
    public async Task TC_BUG_33_09_DuplicateUpdateByBobLeavesAlicesStoredBasketUntouched()
    {
        const string aliceId = "bug33-tc09-alice";
        const string bobId = "bug33-tc09-bob";
        await _repository.UpdateBasketAsync(new CustomerBasket
        {
            BuyerId = aliceId,
            Items = [new ModelBasketItem { ProductId = Product1, Quantity = 1 }]
        });
        var service = await StartWithNoBasketAsync(bobId);

        await service.UpdateBasket(UpdateRequest((Product1, 1), (Product1, 2)), ContextFor(bobId));

        var alice = await _repository.GetBasketAsync(aliceId);
        Assert.NotNull(alice);
        Assert.Equal(aliceId, alice.BuyerId);
        var aliceLine = Assert.Single(alice.Items);
        Assert.Equal(Product1, aliceLine.ProductId);
        Assert.Equal(1, aliceLine.Quantity);

        var bob = await _repository.GetBasketAsync(bobId);
        Assert.NotNull(bob);
        Assert.Equal(bobId, bob.BuyerId);
        var bobLine = Assert.Single(bob.Items);
        Assert.Equal(Product1, bobLine.ProductId);
        Assert.Equal(3, bobLine.Quantity);
    }
}
