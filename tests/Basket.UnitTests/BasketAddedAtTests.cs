using System.Linq;
using System.Security.Claims;
using eShop.Basket.API.Grpc;
using eShop.Basket.API.Model;
using eShop.Basket.API.Repositories;
using eShop.Basket.UnitTests.Helpers;
using Google.Protobuf.WellKnownTypes;
using Grpc.Core;
using Microsoft.Extensions.Logging.Abstractions;
using BasketItem = eShop.Basket.API.Model.BasketItem;
using GrpcBasketItem = eShop.Basket.API.Grpc.BasketItem;

namespace eShop.Basket.UnitTests;

// ADDED-1: the Basket API keeps the UTC time each product was first added to a basket line (added_at).
[TestClass]
[TestCategory("ADDED-1")]
public class BasketAddedAtTests
{
    private const string BuyerId = "buyer-1";

    public TestContext TestContext { get; set; } = null!;

    [TestMethod]
    [TestProperty("TestCase", "TC-ADDED-1-05")]
    public async Task TC_ADDED_1_05_UpdateBasketStampsNewProductWithCurrentUtcTime()
    {
        var now = Utc(2026, 11, 20, 10, 15, 30);
        var store = new BasketStore(null);
        var service = CreateService(store.Repository, now);

        var response = await service.UpdateBasket(Request((99, 1)), CreateContext(BuyerId));

        var saved = store.Saved.Single();
        Assert.AreEqual(BuyerId, saved.BuyerId);
        Assert.HasCount(1, saved.Items);
        Assert.AreEqual(99, saved.Items[0].ProductId);
        Assert.AreEqual(1, saved.Items[0].Quantity);
        Assert.AreEqual(now, saved.Items[0].AddedAt);
        Assert.AreEqual(DateTimeKind.Utc, saved.Items[0].AddedAt!.Value.Kind);
        Assert.HasCount(1, response.Items);
        Assert.AreEqual(99, response.Items[0].ProductId);
        Assert.AreEqual(1, response.Items[0].Quantity);
        Assert.AreEqual(Timestamp.FromDateTime(now), response.Items[0].AddedAt);
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-ADDED-1-06")]
    public async Task TC_ADDED_1_06_UpdateBasketKeepsStoredAddedAtWhenQuantityChangesDaysLater()
    {
        var now = Utc(2026, 11, 20, 10, 0, 0);
        var watchAdded = Utc(2026, 11, 1, 9, 0, 0);
        var product12Added = Utc(2026, 11, 5, 8, 0, 0);
        var store = new BasketStore(Basket((99, 1, watchAdded), (12, 2, product12Added)));
        var service = CreateService(store.Repository, now);

        var response = await service.UpdateBasket(Request((99, 3), (12, 2)), CreateContext(BuyerId));

        var saved = store.Saved.Single();
        AssertItem(saved, 99, 3, watchAdded);
        AssertItem(saved, 12, 2, product12Added);
        Assert.AreEqual(Timestamp.FromDateTime(watchAdded), ResponseItem(response, 99).AddedAt);
        Assert.AreEqual(Timestamp.FromDateTime(product12Added), ResponseItem(response, 12).AddedAt);
        Assert.IsFalse(saved.Items.Any(item => item.AddedAt == now));
        Assert.IsFalse(response.Items.Any(item => item.AddedAt == Timestamp.FromDateTime(now)));
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-ADDED-1-07")]
    public async Task TC_ADDED_1_07_UpdateBasketIgnoresAddedAtSentByClient()
    {
        var now = Utc(2026, 11, 20, 10, 0, 0);
        var watchAdded = Utc(2026, 11, 1, 9, 0, 0);
        var clientWatchAddedAt = Utc(2020, 1, 1, 0, 0, 0);
        var clientProduct12AddedAt = Utc(2030, 1, 1, 0, 0, 0);
        var store = new BasketStore(Basket((99, 1, watchAdded)));
        var service = CreateService(store.Repository, now);
        var request = new UpdateBasketRequest();
        request.Items.Add(new GrpcBasketItem { ProductId = 99, Quantity = 2, AddedAt = Timestamp.FromDateTime(clientWatchAddedAt) });
        request.Items.Add(new GrpcBasketItem { ProductId = 12, Quantity = 1, AddedAt = Timestamp.FromDateTime(clientProduct12AddedAt) });

        var response = await service.UpdateBasket(request, CreateContext(BuyerId));

        var saved = store.Saved.Single();
        AssertItem(saved, 99, 2, watchAdded);
        AssertItem(saved, 12, 1, now);
        Assert.AreEqual(Timestamp.FromDateTime(watchAdded), ResponseItem(response, 99).AddedAt);
        Assert.AreEqual(Timestamp.FromDateTime(now), ResponseItem(response, 12).AddedAt);
        Assert.AreNotEqual(Timestamp.FromDateTime(clientWatchAddedAt), ResponseItem(response, 99).AddedAt);
        Assert.AreNotEqual(Timestamp.FromDateTime(clientProduct12AddedAt), ResponseItem(response, 12).AddedAt);
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-ADDED-1-08")]
    public async Task TC_ADDED_1_08_ProductRemovedAndAddedAgainLaterGetsTimeOfNewAdd()
    {
        var firstAdded = Utc(2026, 11, 1, 9, 0, 0);
        var removedAt = Utc(2026, 11, 10, 12, 0, 0);
        var addedAgainAt = Utc(2026, 11, 20, 10, 0, 0);
        var store = new BasketStore(Basket((99, 1, firstAdded), (12, 1, firstAdded)));
        var clock = new FixedTimeProvider(removedAt);
        var service = new BasketService(store.Repository, NullLogger<BasketService>.Instance, clock);

        await service.UpdateBasket(Request((12, 1)), CreateContext(BuyerId));
        var afterRemove = store.Current;
        clock.UtcNow = addedAgainAt;
        var response = await service.UpdateBasket(Request((12, 1), (99, 1)), CreateContext(BuyerId));

        Assert.HasCount(1, afterRemove.Items);
        AssertItem(afterRemove, 12, 1, firstAdded);
        var afterReAdd = store.Saved[1];
        AssertItem(afterReAdd, 99, 1, addedAgainAt);
        AssertItem(afterReAdd, 12, 1, firstAdded);
        Assert.AreEqual(Timestamp.FromDateTime(addedAgainAt), ResponseItem(response, 99).AddedAt);
        Assert.AreEqual(Timestamp.FromDateTime(firstAdded), ResponseItem(response, 12).AddedAt);
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-ADDED-1-10")]
    public async Task TC_ADDED_1_10_GetBasketReturnsLineStoredWithoutDateWithNoAddedAt()
    {
        var product12Added = Utc(2026, 11, 1, 9, 0, 0);
        var repository = Substitute.For<IBasketRepository>();
        repository.GetBasketAsync(BuyerId).Returns(Task.FromResult(Basket((99, 1, null), (12, 1, product12Added))));
        var service = CreateService(repository, Utc(2026, 11, 20, 10, 0, 0));

        var response = await service.GetBasket(new GetBasketRequest(), CreateContext(BuyerId));

        Assert.HasCount(2, response.Items);
        var legacyLine = ResponseItem(response, 99);
        Assert.AreEqual(1, legacyLine.Quantity);
        Assert.IsNull(legacyLine.AddedAt);
        Assert.AreEqual(Timestamp.FromDateTime(product12Added), ResponseItem(response, 12).AddedAt);
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-ADDED-1-11")]
    public async Task TC_ADDED_1_11_LineStoredWithoutDateStaysWithoutOneWhenQuantityChanges()
    {
        var store = new BasketStore(Basket((99, 1, null)));
        var service = CreateService(store.Repository, Utc(2026, 11, 20, 10, 0, 0));

        var response = await service.UpdateBasket(Request((99, 4)), CreateContext(BuyerId));

        var saved = store.Saved.Single();
        Assert.HasCount(1, saved.Items);
        AssertItem(saved, 99, 4, null);
        Assert.HasCount(1, response.Items);
        Assert.AreEqual(4, ResponseItem(response, 99).Quantity);
        Assert.IsNull(ResponseItem(response, 99).AddedAt);
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-ADDED-1-14")]
    public async Task TC_ADDED_1_14_QuantityUpdateAfterConcurrentRemoveAndReAddDoesNotWriteBackOldDate()
    {
        var now = Utc(2026, 11, 25, 8, 0, 0);
        var readBeforeConflict = Utc(2026, 11, 1, 9, 0, 0);
        var addedAgain = Utc(2026, 11, 20, 10, 0, 0);
        var stored = Basket((99, 1, readBeforeConflict));
        CustomerBasket saved = null!;
        var updateCalls = 0;
        var repository = Substitute.For<IBasketRepository>();
        repository.UpdateBasketAsync(BuyerId, Arg.Any<Func<CustomerBasket, CustomerBasket>>())
            .Returns(call =>
            {
                var update = call.Arg<Func<CustomerBasket, CustomerBasket>>();
                updateCalls++;
                _ = update(stored);
                // A concurrent request removed product 99 and added it again before this write landed.
                stored = Basket((99, 1, addedAgain));
                updateCalls++;
                saved = update(stored);
                return saved;
            });
        var service = CreateService(repository, now);

        var response = await service.UpdateBasket(Request((99, 3)), CreateContext(BuyerId));

        Assert.AreEqual(2, updateCalls);
        await repository.Received(1).UpdateBasketAsync(BuyerId, Arg.Any<Func<CustomerBasket, CustomerBasket>>());
        Assert.HasCount(1, saved.Items);
        AssertItem(saved, 99, 3, addedAgain);
        Assert.HasCount(1, response.Items);
        Assert.AreEqual(99, response.Items[0].ProductId);
        Assert.AreEqual(3, response.Items[0].Quantity);
        Assert.AreEqual(Timestamp.FromDateTime(addedAgain), response.Items[0].AddedAt);
        Assert.AreNotEqual(readBeforeConflict, saved.Items[0].AddedAt);
        Assert.AreNotEqual(now, saved.Items[0].AddedAt);
        Assert.AreNotEqual(Timestamp.FromDateTime(readBeforeConflict), response.Items[0].AddedAt);
        Assert.AreNotEqual(Timestamp.FromDateTime(now), response.Items[0].AddedAt);
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-ADDED-1-15")]
    public async Task TC_ADDED_1_15_FirstCommittedTimeOfCompetingFirstAddsIsKept()
    {
        var now = Utc(2026, 11, 20, 10, 0, 5);
        var committedByCompetitor = Utc(2026, 11, 20, 10, 0, 0);
        CustomerBasket firstAttempt = null!;
        CustomerBasket saved = null!;
        var repository = Substitute.For<IBasketRepository>();
        repository.UpdateBasketAsync(BuyerId, Arg.Any<Func<CustomerBasket, CustomerBasket>>())
            .Returns(call =>
            {
                var update = call.Arg<Func<CustomerBasket, CustomerBasket>>();
                // No basket yet; the "key absent" write conflicts because the competing first add committed first.
                firstAttempt = update(null!);
                var stored = Basket((99, 1, committedByCompetitor));
                saved = update(stored);
                return saved;
            });
        var service = CreateService(repository, now);

        var response = await service.UpdateBasket(Request((99, 2)), CreateContext(BuyerId));

        AssertItem(firstAttempt, 99, 2, now);
        Assert.AreNotSame(firstAttempt, saved);
        Assert.HasCount(1, saved.Items);
        AssertItem(saved, 99, 2, committedByCompetitor);
        Assert.HasCount(1, response.Items);
        Assert.AreEqual(99, response.Items[0].ProductId);
        Assert.AreEqual(Timestamp.FromDateTime(committedByCompetitor), response.Items[0].AddedAt);
        Assert.AreNotEqual(Timestamp.FromDateTime(now), response.Items[0].AddedAt);
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-ADDED-1-17")]
    public async Task TC_ADDED_1_17_RepeatedConcurrentWriteConflictsAreReportedAsAborted()
    {
        var repository = Substitute.For<IBasketRepository>();
        repository.UpdateBasketAsync(BuyerId, Arg.Any<Func<CustomerBasket, CustomerBasket>>())
            .Returns(Task.FromException<CustomerBasket>(new BasketConcurrencyException(BuyerId, 10)));
        var service = CreateService(repository, Utc(2026, 11, 20, 10, 0, 0));

        var exception = await Assert.ThrowsExactlyAsync<RpcException>(() =>
            service.UpdateBasket(Request((99, 2)), CreateContext(BuyerId)));

        Assert.AreEqual(StatusCode.Aborted, exception.StatusCode);
        Assert.AreNotEqual(StatusCode.NotFound, exception.StatusCode);
        Assert.DoesNotContain("does not exist", exception.Status.Detail);
        await repository.DidNotReceive().UpdateBasketAsync(Arg.Any<CustomerBasket>());
    }

    private static DateTime Utc(int year, int month, int day, int hour, int minute, int second) =>
        new(year, month, day, hour, minute, second, DateTimeKind.Utc);

    private static BasketService CreateService(IBasketRepository repository, DateTime utcNow) =>
        new(repository, NullLogger<BasketService>.Instance, new FixedTimeProvider(utcNow));

    private static CustomerBasket Basket(params (int ProductId, int Quantity, DateTime? AddedAt)[] items) =>
        new(BuyerId)
        {
            Items = [.. items.Select(item => new BasketItem { ProductId = item.ProductId, Quantity = item.Quantity, AddedAt = item.AddedAt })]
        };

    private static UpdateBasketRequest Request(params (int ProductId, int Quantity)[] items)
    {
        var request = new UpdateBasketRequest();
        foreach (var (productId, quantity) in items)
        {
            request.Items.Add(new GrpcBasketItem { ProductId = productId, Quantity = quantity });
        }

        return request;
    }

    private static void AssertItem(CustomerBasket basket, int productId, int quantity, DateTime? addedAt)
    {
        var item = basket.Items.Single(i => i.ProductId == productId);
        Assert.AreEqual(quantity, item.Quantity);
        Assert.AreEqual(addedAt, item.AddedAt);
    }

    private static GrpcBasketItem ResponseItem(CustomerBasketResponse response, int productId) =>
        response.Items.Single(item => item.ProductId == productId);

    private TestServerCallContext CreateContext(string userId)
    {
        var context = TestServerCallContext.Create(cancellationToken: TestContext.CancellationToken);
        var httpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity([new Claim("sub", userId)]))
        };
        context.SetUserState("__HttpContext", httpContext);
        return context;
    }

    /// <summary>
    /// A repository substitute over one stored basket: UpdateBasketAsync(buyerId, update) applies update to the
    /// stored basket, keeps the result as the new stored basket and returns it, as the real repository does without
    /// a conflict.
    /// </summary>
    private sealed class BasketStore
    {
        public BasketStore(CustomerBasket stored)
        {
            Current = stored;
            Repository.UpdateBasketAsync(BuyerId, Arg.Any<Func<CustomerBasket, CustomerBasket>>())
                .Returns(call =>
                {
                    var saved = call.Arg<Func<CustomerBasket, CustomerBasket>>()(Current);
                    Current = saved;
                    Saved.Add(saved);
                    return saved;
                });
        }

        public IBasketRepository Repository { get; } = Substitute.For<IBasketRepository>();

        public CustomerBasket Current { get; private set; }

        public List<CustomerBasket> Saved { get; } = [];
    }
}
