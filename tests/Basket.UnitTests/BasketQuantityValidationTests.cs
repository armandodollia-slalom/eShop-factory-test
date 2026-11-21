using System.Security.Claims;
using eShop.Basket.API.Grpc;
using eShop.Basket.API.Model;
using eShop.Basket.API.Repositories;
using eShop.Basket.UnitTests.Helpers;
using Grpc.Core;
using Microsoft.Extensions.Logging.Abstractions;
using GrpcBasketItem = eShop.Basket.API.Grpc.BasketItem;

namespace eShop.Basket.UnitTests;

[TestClass]
[TestCategory("BUG-8")]
public class BasketQuantityValidationTests
{
    private const string Alice = "alice";

    public TestContext TestContext { get; set; } = null!;

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-8-01")]
    public async Task TC_BUG_8_01_QuantitiesMinusThreeAndZeroAreRejectedAndNothingIsSaved()
    {
        await AssertRejectedAsync((7, -3), (6, 0));
    }

    // TC-BUG-8-02 is the quantity 0 row, TC-BUG-8-03 the quantity -1 row.
    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-8-02")]
    [TestProperty("TestCase", "TC-BUG-8-03")]
    [DataRow(6, 0)]
    [DataRow(7, -1)]
    public async Task TC_BUG_8_02_and_TC_BUG_8_03_SingleLineBelowOneIsRejected(int productId, int quantity)
    {
        await AssertRejectedAsync((productId, quantity));
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-8-06")]
    public async Task TC_BUG_8_06_RejectionMessageNamesEveryInvalidProduct()
    {
        var repository = Substitute.For<IBasketRepository>();
        var service = new BasketService(repository, NullLogger<BasketService>.Instance);

        var exception = await Assert.ThrowsAsync<RpcException>(() =>
            service.UpdateBasket(CreateRequest((7, -3), (6, 0)), CreateContext(Alice)));

        Assert.AreEqual(StatusCode.InvalidArgument, exception.Status.StatusCode);
        Assert.AreEqual(
            "Invalid number of units for product 7: quantity -3; Invalid number of units for product 6: quantity 0",
            exception.Status.Detail);
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-8-04")]
    public async Task TC_BUG_8_04_SingleLineWithQuantityOneIsAcceptedAndSaved()
    {
        var repository = Substitute.For<IBasketRepository>();
        repository.UpdateBasketAsync(Arg.Any<CustomerBasket>())
            .Returns(call => call.Arg<CustomerBasket>());
        var service = new BasketService(repository, NullLogger<BasketService>.Instance);

        var response = await service.UpdateBasket(CreateRequest((7, 1)), CreateContext(Alice));

        await repository.Received(1).UpdateBasketAsync(Arg.Is<CustomerBasket>(basket =>
            basket.BuyerId == Alice &&
            basket.Items.Count == 1 &&
            basket.Items[0].ProductId == 7 &&
            basket.Items[0].Quantity == 1));
        Assert.HasCount(1, response.Items);
        Assert.AreEqual(7, response.Items[0].ProductId);
        Assert.AreEqual(1, response.Items[0].Quantity);
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-8-05")]
    public async Task TC_BUG_8_05_OneInvalidLineAmongValidLinesRejectsTheWholeUpdate()
    {
        var repository = Substitute.For<IBasketRepository>();
        var service = new BasketService(repository, NullLogger<BasketService>.Instance);

        var exception = await Assert.ThrowsAsync<RpcException>(() =>
            service.UpdateBasket(CreateRequest((1, 2), (7, -3), (3, 5)), CreateContext(Alice)));

        Assert.AreEqual(StatusCode.InvalidArgument, exception.StatusCode);
        await repository.DidNotReceive().UpdateBasketAsync(Arg.Any<CustomerBasket>());
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-8-07")]
    public async Task TC_BUG_8_07_AnonymousCallerWithInvalidQuantityGetsUnauthenticated()
    {
        var repository = Substitute.For<IBasketRepository>();
        var service = new BasketService(repository, NullLogger<BasketService>.Instance);

        var exception = await Assert.ThrowsAsync<RpcException>(() =>
            service.UpdateBasket(CreateRequest((7, -3)), CreateContext(null!)));

        Assert.AreEqual(StatusCode.Unauthenticated, exception.StatusCode);
        await repository.DidNotReceive().UpdateBasketAsync(Arg.Any<CustomerBasket>());
    }

    private async Task AssertRejectedAsync(params (int ProductId, int Quantity)[] items)
    {
        var repository = Substitute.For<IBasketRepository>();
        var service = new BasketService(repository, NullLogger<BasketService>.Instance);

        var exception = await Assert.ThrowsAsync<RpcException>(() =>
            service.UpdateBasket(CreateRequest(items), CreateContext(Alice)));

        Assert.AreEqual(StatusCode.InvalidArgument, exception.StatusCode);
        await repository.DidNotReceive().UpdateBasketAsync(Arg.Any<CustomerBasket>());
    }

    private static UpdateBasketRequest CreateRequest(params (int ProductId, int Quantity)[] items)
    {
        var request = new UpdateBasketRequest();
        foreach (var (productId, quantity) in items)
        {
            request.Items.Add(new GrpcBasketItem { ProductId = productId, Quantity = quantity });
        }

        return request;
    }

    private TestServerCallContext CreateContext(string userId)
    {
        var context = TestServerCallContext.Create(cancellationToken: TestContext.CancellationToken);
        var httpContext = new DefaultHttpContext();
        if (userId is not null)
        {
            httpContext.User = new ClaimsPrincipal(new ClaimsIdentity([new Claim("sub", userId)]));
        }
        context.SetUserState("__HttpContext", httpContext);
        return context;
    }
}
