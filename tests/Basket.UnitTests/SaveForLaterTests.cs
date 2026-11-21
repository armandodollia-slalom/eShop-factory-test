using System.Linq;
using System.Security.Claims;
using eShop.Basket.API.Grpc;
using eShop.Basket.API.Model;
using eShop.Basket.API.Repositories;
using eShop.Basket.UnitTests.Helpers;
using Grpc.Core;
using Microsoft.Extensions.Logging.Abstractions;
using GrpcItem = eShop.Basket.API.Grpc.BasketItem;
using ModelItem = eShop.Basket.API.Model.BasketItem;

namespace eShop.Basket.UnitTests;

[TestClass]
[TestCategory("CART-1")]
public class SaveForLaterTests
{
    private const string UserId = "user-1";

    public TestContext TestContext { get; set; } = null!;

    [TestMethod]
    [TestProperty("TestCase", "TC-CART-1-01")]
    public async Task TC_CART_1_01_SaveForLaterMovesWholeLineWithQuantity()
    {
        var repository = RepositoryWith(Basket([Line(1, 2), Line(2, 1)], []));
        var service = CreateService(repository);

        var response = await service.SaveForLater(new SaveForLaterRequest { ProductId = 1 }, CreateContext(UserId));

        AssertLines([(2, 1)], response.Items);
        AssertLines([(1, 2)], response.SavedItems);
        await repository.Received(1).UpdateBasketAsync(Arg.Is<CustomerBasket>(b =>
            b.Items.Count == 1 && b.Items[0].ProductId == 2 && b.Items[0].Quantity == 1 &&
            b.SavedItems.Count == 1 && b.SavedItems[0].ProductId == 1 && b.SavedItems[0].Quantity == 2));
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-CART-1-02")]
    public async Task TC_CART_1_02_MoveToCartPutsSavedProductIntoEmptyCart()
    {
        var repository = RepositoryWith(Basket([], [Line(1, 2)]));
        var service = CreateService(repository);

        var response = await service.MoveToCart(new MoveToCartRequest { ProductId = 1 }, CreateContext(UserId));

        AssertLines([(1, 2)], response.Items);
        Assert.IsEmpty(response.SavedItems);
        await repository.Received(1).UpdateBasketAsync(Arg.Is<CustomerBasket>(b =>
            b.Items.Count == 1 && b.Items[0].ProductId == 1 && b.Items[0].Quantity == 2 && b.SavedItems.Count == 0));
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-CART-1-03")]
    public async Task TC_CART_1_03_MoveToCartAddsQuantityToProductAlreadyInCart()
    {
        var repository = RepositoryWith(Basket([Line(1, 1)], [Line(1, 2)]));
        var service = CreateService(repository);

        var response = await service.MoveToCart(new MoveToCartRequest { ProductId = 1 }, CreateContext(UserId));

        AssertLines([(1, 3)], response.Items);
        Assert.IsEmpty(response.SavedItems);
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-CART-1-04")]
    public async Task TC_CART_1_04_RemoveSavedItemDeletesSavedProductAndKeepsCart()
    {
        var repository = RepositoryWith(Basket([Line(2, 1)], [Line(1, 2), Line(3, 1)]));
        var service = CreateService(repository);

        var response = await service.RemoveSavedItem(new RemoveSavedItemRequest { ProductId = 1 }, CreateContext(UserId));

        AssertLines([(2, 1)], response.Items);
        AssertLines([(3, 1)], response.SavedItems);
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-CART-1-05")]
    public async Task TC_CART_1_05_GetBasketReturnsSavedItemsNextToCartItems()
    {
        var repository = Substitute.For<IBasketRepository>();
        repository.GetBasketAsync(UserId).Returns(Task.FromResult(Basket([Line(2, 1)], [Line(1, 2)])));
        var service = CreateService(repository);

        var response = await service.GetBasket(new GetBasketRequest(), CreateContext(UserId));

        AssertLines([(2, 1)], response.Items);
        AssertLines([(1, 2)], response.SavedItems);
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-CART-1-06")]
    public async Task TC_CART_1_06_UpdateBasketNeverChangesSavedItems()
    {
        var repository = RepositoryWith(Basket([Line(2, 1)], [Line(1, 2)]));
        var service = CreateService(repository);
        var request = new UpdateBasketRequest();
        request.Items.Add(new GrpcItem { ProductId = 2, Quantity = 1 });
        request.Items.Add(new GrpcItem { ProductId = 3, Quantity = 1 });

        var response = await service.UpdateBasket(request, CreateContext(UserId));

        AssertLines([(2, 1), (3, 1)], response.Items);
        AssertLines([(1, 2)], response.SavedItems);
        await repository.Received(1).UpdateBasketAsync(Arg.Is<CustomerBasket>(b =>
            b.SavedItems.Count == 1 && b.SavedItems[0].ProductId == 1 && b.SavedItems[0].Quantity == 2));
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-CART-1-07")]
    public async Task TC_CART_1_07_SaveForLaterOfProductNotInCartFailsWithNotFound()
    {
        var repository = RepositoryWith(Basket([Line(2, 1)], []));
        var service = CreateService(repository);

        var exception = await Assert.ThrowsExactlyAsync<RpcException>(
            () => service.SaveForLater(new SaveForLaterRequest { ProductId = 99 }, CreateContext(UserId)));

        Assert.AreEqual(StatusCode.NotFound, exception.StatusCode);
        await repository.DidNotReceive().UpdateBasketAsync(Arg.Any<CustomerBasket>());
        await repository.DidNotReceive().DeleteBasketAsync(Arg.Any<string>());
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-CART-1-08")]
    public async Task TC_CART_1_08_MoveToCartOfProductNotSavedFailsWithNotFound()
    {
        var repository = RepositoryWith(Basket([Line(2, 1)], [Line(1, 2)]));
        var service = CreateService(repository);

        var exception = await Assert.ThrowsExactlyAsync<RpcException>(
            () => service.MoveToCart(new MoveToCartRequest { ProductId = 2 }, CreateContext(UserId)));

        Assert.AreEqual(StatusCode.NotFound, exception.StatusCode);
        await repository.DidNotReceive().UpdateBasketAsync(Arg.Any<CustomerBasket>());
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-CART-1-09")]
    public async Task TC_CART_1_09_RemoveSavedItemOfProductNotSavedFailsWithNotFound()
    {
        var repository = RepositoryWith(Basket([Line(2, 1)], [Line(1, 2)]));
        var service = CreateService(repository);

        var exception = await Assert.ThrowsExactlyAsync<RpcException>(
            () => service.RemoveSavedItem(new RemoveSavedItemRequest { ProductId = 2 }, CreateContext(UserId)));

        Assert.AreEqual(StatusCode.NotFound, exception.StatusCode);
        await repository.DidNotReceive().UpdateBasketAsync(Arg.Any<CustomerBasket>());
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-CART-1-10")]
    public async Task TC_CART_1_10_NewOperationsRejectAnonymousCaller()
    {
        var repository = Substitute.For<IBasketRepository>();
        var service = CreateService(repository);

        var save = await Assert.ThrowsExactlyAsync<RpcException>(
            () => service.SaveForLater(new SaveForLaterRequest { ProductId = 1 }, CreateContext(null!)));
        var move = await Assert.ThrowsExactlyAsync<RpcException>(
            () => service.MoveToCart(new MoveToCartRequest { ProductId = 1 }, CreateContext(null!)));
        var remove = await Assert.ThrowsExactlyAsync<RpcException>(
            () => service.RemoveSavedItem(new RemoveSavedItemRequest { ProductId = 1 }, CreateContext(null!)));

        Assert.AreEqual(StatusCode.Unauthenticated, save.StatusCode);
        Assert.AreEqual(StatusCode.Unauthenticated, move.StatusCode);
        Assert.AreEqual(StatusCode.Unauthenticated, remove.StatusCode);
        await repository.DidNotReceive().UpdateBasketAsync(Arg.Any<CustomerBasket>());
    }

    private static BasketService CreateService(IBasketRepository repository)
        => new(repository, NullLogger<BasketService>.Instance);

    private static IBasketRepository RepositoryWith(CustomerBasket basket)
    {
        var repository = Substitute.For<IBasketRepository>();
        repository.GetBasketAsync(UserId).Returns(Task.FromResult(basket));
        repository.UpdateBasketAsync(Arg.Any<CustomerBasket>()).Returns(call => Task.FromResult(call.Arg<CustomerBasket>()));
        return repository;
    }

    private static CustomerBasket Basket(List<ModelItem> items, List<ModelItem> saved)
        => new() { BuyerId = UserId, Items = items, SavedItems = saved };

    private static ModelItem Line(int productId, int quantity)
        => new() { Id = $"line-{productId}", ProductId = productId, Quantity = quantity };

    private static void AssertLines((int ProductId, int Quantity)[] expected, IEnumerable<GrpcItem> actual)
        => CollectionAssert.AreEqual(expected, actual.Select(i => (i.ProductId, i.Quantity)).ToArray());

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
