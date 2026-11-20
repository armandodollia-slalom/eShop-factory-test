using System.Security.Claims;
using eShop.Basket.API.Grpc;
using eShop.Basket.API.IntegrationEvents.EventHandling;
using eShop.Basket.API.IntegrationEvents.EventHandling.Events;
using eShop.Basket.API.Model;
using eShop.Basket.API.Repositories;
using eShop.Basket.UnitTests.Helpers;
using Grpc.Core;
using Microsoft.Extensions.Logging.Abstractions;
using BasketItem = eShop.Basket.API.Model.BasketItem;

namespace eShop.Basket.UnitTests;

[TestClass]
public class BasketServiceTests
{
    public TestContext TestContext { get; set; } = null!;

    [TestMethod]
    public async Task GetBasketReturnsEmptyForNoUser()
    {
        var mockRepository = Substitute.For<IBasketRepository>();
        var service = new BasketService(mockRepository, NullLogger<BasketService>.Instance, TimeProvider.System);
        var serverCallContext = TestServerCallContext.Create(cancellationToken: TestContext.CancellationToken);
        serverCallContext.SetUserState("__HttpContext", new DefaultHttpContext());

        var response = await service.GetBasket(new GetBasketRequest(), serverCallContext);

        Assert.IsInstanceOfType<CustomerBasketResponse>(response);
        Assert.IsEmpty(response.Items);
    }

    [TestMethod]
    public async Task GetBasketReturnsItemsForValidUserId()
    {
        var mockRepository = Substitute.For<IBasketRepository>();
        List<BasketItem> items = [new BasketItem { Id = "some-id" }];
        mockRepository.GetBasketAsync("1").Returns(Task.FromResult(new CustomerBasket { BuyerId = "1", Items = items }));
        var service = new BasketService(mockRepository, NullLogger<BasketService>.Instance, TimeProvider.System);
        var serverCallContext = TestServerCallContext.Create(cancellationToken: TestContext.CancellationToken);
        var httpContext = new DefaultHttpContext();
        httpContext.User = new ClaimsPrincipal(new ClaimsIdentity([new Claim("sub", "1")]));
        serverCallContext.SetUserState("__HttpContext", httpContext);

        var response = await service.GetBasket(new GetBasketRequest(), serverCallContext);

        Assert.IsInstanceOfType<CustomerBasketResponse>(response);
        Assert.HasCount(1, response.Items);
    }

    [TestMethod]
    public async Task GetBasketReturnsEmptyForInvalidUserId()
    {
        var mockRepository = Substitute.For<IBasketRepository>();
        List<BasketItem> items = [new BasketItem { Id = "some-id" }];
        mockRepository.GetBasketAsync("1").Returns(Task.FromResult(new CustomerBasket { BuyerId = "1", Items = items }));
        var service = new BasketService(mockRepository, NullLogger<BasketService>.Instance, TimeProvider.System);
        var serverCallContext = TestServerCallContext.Create(cancellationToken: TestContext.CancellationToken);
        var httpContext = new DefaultHttpContext();
        serverCallContext.SetUserState("__HttpContext", httpContext);

        var response = await service.GetBasket(new GetBasketRequest(), serverCallContext);

        Assert.IsInstanceOfType<CustomerBasketResponse>(response);
        Assert.IsEmpty(response.Items);
    }

    [TestMethod]
    public async Task UpdateBasketPersistsItemsForAuthenticatedUser()
    {
        var repository = Substitute.For<IBasketRepository>();
        repository.UpdateBasketAsync(Arg.Any<string>(), Arg.Any<Func<CustomerBasket, CustomerBasket>>())
            .Returns(call => call.Arg<Func<CustomerBasket, CustomerBasket>>()(null!));
        var service = new BasketService(repository, NullLogger<BasketService>.Instance, TimeProvider.System);
        var context = CreateContext("buyer-1");
        var request = new UpdateBasketRequest();
        request.Items.Add(new eShop.Basket.API.Grpc.BasketItem { ProductId = 42, Quantity = 3 });

        var response = await service.UpdateBasket(request, context);

        Assert.HasCount(1, response.Items);
        Assert.AreEqual(42, response.Items[0].ProductId);
        Assert.AreEqual(3, response.Items[0].Quantity);
        await repository.Received(1).UpdateBasketAsync("buyer-1", Arg.Any<Func<CustomerBasket, CustomerBasket>>());
    }

    [TestMethod]
    public async Task UpdateBasketRecomputesAddedAtFromBasketStoredAfterConcurrentRemoveAndReAdd()
    {
        var originallyAdded = new DateTime(2026, 11, 1, 9, 0, 0, DateTimeKind.Utc);
        var reAdded = new DateTime(2026, 11, 3, 15, 30, 0, DateTimeKind.Utc);
        var staleBasket = new CustomerBasket("buyer-1") { Items = [new BasketItem { ProductId = 42, Quantity = 1, AddedAt = originallyAdded }] };
        var currentBasket = new CustomerBasket("buyer-1") { Items = [new BasketItem { ProductId = 42, Quantity = 1, AddedAt = reAdded }] };
        var repository = Substitute.For<IBasketRepository>();
        // The first attempt read the basket before another request removed and re-added the product; its write
        // conflicts, so the repository re-runs the update against the basket stored now.
        repository.UpdateBasketAsync("buyer-1", Arg.Any<Func<CustomerBasket, CustomerBasket>>())
            .Returns(call =>
            {
                var update = call.Arg<Func<CustomerBasket, CustomerBasket>>();
                _ = update(staleBasket);
                return update(currentBasket);
            });
        var service = new BasketService(repository, NullLogger<BasketService>.Instance, TimeProvider.System);
        var request = new UpdateBasketRequest();
        request.Items.Add(new eShop.Basket.API.Grpc.BasketItem { ProductId = 42, Quantity = 5 });

        var response = await service.UpdateBasket(request, CreateContext("buyer-1"));

        Assert.HasCount(1, response.Items);
        Assert.AreEqual(5, response.Items[0].Quantity);
        Assert.AreEqual(reAdded, response.Items[0].AddedAt.ToDateTime());
    }

    [TestMethod]
    public async Task UpdateBasketRejectsAnonymousUser()
    {
        var repository = Substitute.For<IBasketRepository>();
        var service = new BasketService(repository, NullLogger<BasketService>.Instance, TimeProvider.System);

        var exception = await Assert.ThrowsAsync<RpcException>(() =>
            service.UpdateBasket(new UpdateBasketRequest(), CreateContext(null!)));

        Assert.AreEqual(StatusCode.Unauthenticated, exception.StatusCode);
        await repository.DidNotReceive().UpdateBasketAsync(Arg.Any<string>(), Arg.Any<Func<CustomerBasket, CustomerBasket>>());
    }

    [TestMethod]
    public async Task UpdateBasketReturnsNotFoundWhenRepositoryCannotPersist()
    {
        var repository = Substitute.For<IBasketRepository>();
        repository.UpdateBasketAsync(Arg.Any<string>(), Arg.Any<Func<CustomerBasket, CustomerBasket>>())
            .Returns(Task.FromResult<CustomerBasket>(null!));
        var service = new BasketService(repository, NullLogger<BasketService>.Instance, TimeProvider.System);

        var exception = await Assert.ThrowsAsync<RpcException>(() =>
            service.UpdateBasket(new UpdateBasketRequest(), CreateContext("missing")));

        Assert.AreEqual(StatusCode.NotFound, exception.StatusCode);
    }

    [TestMethod]
    public async Task UpdateBasketReturnsAbortedWhenBasketKeepsChangingConcurrently()
    {
        var repository = Substitute.For<IBasketRepository>();
        repository.UpdateBasketAsync(Arg.Any<string>(), Arg.Any<Func<CustomerBasket, CustomerBasket>>())
            .Returns(Task.FromException<CustomerBasket>(new BasketConcurrencyException("buyer-1", 10)));
        var service = new BasketService(repository, NullLogger<BasketService>.Instance, TimeProvider.System);

        var exception = await Assert.ThrowsAsync<RpcException>(() =>
            service.UpdateBasket(new UpdateBasketRequest(), CreateContext("buyer-1")));

        Assert.AreEqual(StatusCode.Aborted, exception.StatusCode);
    }

    [TestMethod]
    public async Task DeleteBasketRemovesAuthenticatedUsersBasket()
    {
        var repository = Substitute.For<IBasketRepository>();
        var service = new BasketService(repository, NullLogger<BasketService>.Instance, TimeProvider.System);

        await service.DeleteBasket(new DeleteBasketRequest(), CreateContext("buyer-1"));

        await repository.Received(1).DeleteBasketAsync("buyer-1");
    }

    [TestMethod]
    public async Task OrderStartedEventRemovesUsersBasket()
    {
        var repository = Substitute.For<IBasketRepository>();
        var handler = new OrderStartedIntegrationEventHandler(
            repository,
            NullLogger<OrderStartedIntegrationEventHandler>.Instance);

        await handler.Handle(new OrderStartedIntegrationEvent("buyer-1"));

        await repository.Received(1).DeleteBasketAsync("buyer-1");
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
