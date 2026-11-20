using System.Net;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Bunit;
using eShop.Basket.API.Grpc;
using eShop.WebApp.Components.Pages.Cart;
using eShop.WebApp.Components.Pages.Item;
using eShop.WebApp.Services;
using eShop.WebAppComponents.Catalog;
using eShop.WebAppComponents.Services;
using Google.Protobuf.WellKnownTypes;
using Grpc.Core;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using GrpcBasketClient = eShop.Basket.API.Grpc.Basket.BasketClient;
using GrpcBasketItem = eShop.Basket.API.Grpc.BasketItem;

namespace eShop.Application.UnitTests;

[TestClass]
[TestCategory("ADDED-1")]
public class BasketUpdateRetryTests
{
    private const string BuyerId = "buyer-1";
    private const int WatchId = 99;
    private const string WatchName = "Adventurer GPS Watch";
    private const decimal WatchPrice = 199.99m;
    private const int OtherProductId = 12;
    private const string AbortedDetail = "factoryfake concurrent change";
    private const string TryAgainText = "Your shopping bag was changed at the same time, so this update was not saved. Please try again.";

    private static readonly CatalogItem Watch = new(WatchId, WatchName, "", WatchPrice, "", 1, new CatalogBrand(1, "factoryfake brand"), 1, new CatalogItemType(1, "factoryfake type"));
    private static readonly CatalogItem OtherProduct = new(OtherProductId, "factoryfake other product", "", 10m, "", 1, new CatalogBrand(1, "factoryfake brand"), 1, new CatalogItemType(1, "factoryfake type"));

    private sealed class FakeCatalogHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var uri = request.RequestUri!;
            var path = uri.AbsolutePath;
            if (path == $"/api/catalog/items/{WatchId}/brand-mates")
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound));
            }

            if (path == $"/api/catalog/items/{WatchId}")
            {
                return Task.FromResult(Json(Watch));
            }

            if (path == "/api/catalog/items/by")
            {
                var ids = uri.Query.TrimStart('?').Split('&').Select(p => int.Parse(p["ids=".Length..]));
                var items = new[] { Watch, OtherProduct }.Where(i => ids.Contains(i.Id)).ToList();
                return Task.FromResult(Json(items));
            }

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound));
        }

        private static HttpResponseMessage Json<T>(T value) => new(HttpStatusCode.OK)
        {
            Content = new StringContent(JsonSerializer.Serialize(value, new JsonSerializerOptions(JsonSerializerDefaults.Web)), Encoding.UTF8, "application/json"),
        };
    }

    private sealed class FixedAuthenticationStateProvider(ClaimsPrincipal user) : AuthenticationStateProvider
    {
        public override Task<AuthenticationState> GetAuthenticationStateAsync() => Task.FromResult(new AuthenticationState(user));
    }

    private static ClaimsPrincipal AuthenticatedBuyer() =>
        new(new ClaimsIdentity([new Claim("sub", BuyerId), new Claim("name", BuyerId)], "factoryfake-auth"));

    private static CustomerBasketResponse Basket(params (int ProductId, int Quantity)[] lines)
    {
        var response = new CustomerBasketResponse();
        foreach (var (productId, quantity) in lines)
        {
            response.Items.Add(new GrpcBasketItem { ProductId = productId, Quantity = quantity });
        }

        return response;
    }

    private static AsyncUnaryCall<T> Call<T>(T response) =>
        new(Task.FromResult(response), Task.FromResult(new Metadata()), () => Status.DefaultSuccess, () => new Metadata(), () => { });

    private static AsyncUnaryCall<T> Aborted<T>() =>
        new(Task.FromException<T>(new RpcException(new Status(StatusCode.Aborted, AbortedDetail))), Task.FromResult(new Metadata()), () => new Status(StatusCode.Aborted, AbortedDetail), () => new Metadata(), () => { });

    private static void ReturnBaskets(GrpcBasketClient client, params CustomerBasketResponse[] baskets)
    {
        var calls = baskets.Select(Call).ToArray();
        client.GetBasketAsync(Arg.Any<GetBasketRequest>(), Arg.Any<Metadata>(), Arg.Any<DateTime?>(), Arg.Any<CancellationToken>())
            .Returns(calls[0], calls[1..]);
    }

    private static List<UpdateBasketRequest> CaptureUpdates(GrpcBasketClient client, Func<int, bool> abortAttempt)
    {
        var requests = new List<UpdateBasketRequest>();
        client.UpdateBasketAsync(Arg.Any<UpdateBasketRequest>(), Arg.Any<Metadata>(), Arg.Any<DateTime?>(), Arg.Any<CancellationToken>())
            .Returns(ci =>
            {
                requests.Add(ci.Arg<UpdateBasketRequest>());
                return abortAttempt(requests.Count) ? Aborted<CustomerBasketResponse>() : Call(new CustomerBasketResponse());
            });
        return requests;
    }

    private static int GetBasketCalls(GrpcBasketClient client) =>
        client.ReceivedCalls().Count(c => c.GetMethodInfo().Name == nameof(GrpcBasketClient.GetBasketAsync));

    private static BasketState CreateBasketState(GrpcBasketClient client, AuthenticationStateProvider auth, CatalogService catalog) =>
        new(new BasketService(client), catalog, new OrderingService(new HttpClient()), auth, NullLogger<BasketState>.Instance);

    private static CatalogService CreateCatalog() =>
        new(new HttpClient(new FakeCatalogHandler()) { BaseAddress = new Uri("http://catalog.test/") });

    private static (BasketState State, Func<int> ChangeCount) CreateSubscribedBasketState(GrpcBasketClient client)
    {
        var state = CreateBasketState(client, new FixedAuthenticationStateProvider(AuthenticatedBuyer()), CreateCatalog());
        var changes = 0;
        state.NotifyOnChange(EventCallback.Factory.Create(new object(), () => changes++));
        return (state, () => changes);
    }

    private static (int ProductId, int Quantity)[] Lines(UpdateBasketRequest request) =>
        request.Items.Select(i => (i.ProductId, i.Quantity)).ToArray();

    [TestMethod]
    [TestProperty("TestCase", "TC-ADDED-1-20")]
    public async Task TC_ADDED_1_20_SetQuantityReReadsBasketAndRetriesOnceWhenAborted()
    {
        var client = Substitute.For<GrpcBasketClient>();
        ReturnBaskets(client, Basket((WatchId, 1)), Basket((WatchId, 1), (OtherProductId, 1)));
        var secondUpdate = new TaskCompletionSource<CustomerBasketResponse>(TaskCreationOptions.RunContinuationsAsynchronously);
        var updates = new List<UpdateBasketRequest>();
        client.UpdateBasketAsync(Arg.Any<UpdateBasketRequest>(), Arg.Any<Metadata>(), Arg.Any<DateTime?>(), Arg.Any<CancellationToken>())
            .Returns(ci =>
            {
                updates.Add(ci.Arg<UpdateBasketRequest>());
                return updates.Count == 1
                    ? Aborted<CustomerBasketResponse>()
                    : new AsyncUnaryCall<CustomerBasketResponse>(secondUpdate.Task, Task.FromResult(new Metadata()), () => Status.DefaultSuccess, () => new Metadata(), () => { });
            });
        var (basketState, changeCount) = CreateSubscribedBasketState(client);

        var setQuantity = basketState.SetQuantityAsync(WatchId, 3);

        using (var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(10)))
        {
            while (updates.Count < 2)
            {
                await Task.Delay(10, timeout.Token);
            }
        }

        Assert.IsFalse(setQuantity.IsCompleted);
        Assert.AreEqual(0, changeCount());

        secondUpdate.SetResult(new CustomerBasketResponse());
        await setQuantity;

        Assert.AreEqual(2, GetBasketCalls(client));
        Assert.HasCount(2, updates);
        CollectionAssert.AreEquivalent(new[] { (WatchId, 3), (OtherProductId, 1) }, Lines(updates[1]));
        Assert.IsTrue(updates[1].Items.All(i => i.AddedAt is null));
        Assert.AreEqual(1, changeCount());
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-ADDED-1-21")]
    public async Task TC_ADDED_1_21_AddReReadsBasketAndRetriesOnceWhenAborted()
    {
        var client = Substitute.For<GrpcBasketClient>();
        ReturnBaskets(client, Basket((WatchId, 1)), Basket((WatchId, 2)));
        var updates = CaptureUpdates(client, attempt => attempt == 1);
        var (basketState, changeCount) = CreateSubscribedBasketState(client);

        await basketState.AddAsync(Watch);

        Assert.AreEqual(2, GetBasketCalls(client));
        Assert.HasCount(2, updates);
        CollectionAssert.AreEqual(new[] { (WatchId, 2) }, Lines(updates[0]));
        CollectionAssert.AreEqual(new[] { (WatchId, 3) }, Lines(updates[1]));
        Assert.IsTrue(updates.SelectMany(u => u.Items).All(i => i.AddedAt is null));
        Assert.AreEqual(1, changeCount());
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-ADDED-1-22")]
    public async Task TC_ADDED_1_22_SecondAbortedAttemptStopsAndReachesTheCaller()
    {
        var client = Substitute.For<GrpcBasketClient>();
        client.GetBasketAsync(Arg.Any<GetBasketRequest>(), Arg.Any<Metadata>(), Arg.Any<DateTime?>(), Arg.Any<CancellationToken>())
            .Returns(_ => Call(Basket((WatchId, 1))));
        var updates = CaptureUpdates(client, _ => true);
        var (basketState, changeCount) = CreateSubscribedBasketState(client);

        var setQuantityError = await Assert.ThrowsExactlyAsync<RpcException>(() => basketState.SetQuantityAsync(WatchId, 3));
        Assert.AreEqual(StatusCode.Aborted, setQuantityError.StatusCode);
        Assert.HasCount(2, updates);

        var addError = await Assert.ThrowsExactlyAsync<RpcException>(() => basketState.AddAsync(Watch));
        Assert.AreEqual(StatusCode.Aborted, addError.StatusCode);
        Assert.HasCount(4, updates);

        Assert.AreEqual(0, changeCount());
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-ADDED-1-23")]
    public void TC_ADDED_1_23_CartAndItemPagesShowTryAgainMessageWhenUpdateStaysAborted()
    {
        using var ctx = new BunitContext();
        var user = AuthenticatedBuyer();
        var auth = new FixedAuthenticationStateProvider(user);
        var client = Substitute.For<GrpcBasketClient>();
        var storedLine = new GrpcBasketItem
        {
            ProductId = WatchId,
            Quantity = 1,
            AddedAt = Timestamp.FromDateTime(new DateTime(2026, 11, 20, 10, 0, 0, DateTimeKind.Utc)),
        };
        client.GetBasketAsync(Arg.Any<GetBasketRequest>(), Arg.Any<Metadata>(), Arg.Any<DateTime?>(), Arg.Any<CancellationToken>())
            .Returns(_ => Call(new CustomerBasketResponse { Items = { storedLine } }));
        var updates = CaptureUpdates(client, _ => true);
        var catalog = CreateCatalog();

        ctx.Services.AddSingleton<AuthenticationStateProvider>(auth);
        ctx.Services.AddSingleton(catalog);
        ctx.Services.AddSingleton(CreateBasketState(client, auth, catalog));
        ctx.Services.AddSingleton<IProductImageUrlProvider>(Substitute.For<IProductImageUrlProvider>());
        ctx.Services.AddSingleton<ILogger<ItemPage>>(NullLogger<ItemPage>.Instance);

        // Step 1: the shopping bag
        var cart = ctx.Render<CartPage>();
        cart.WaitForAssertion(() => Assert.HasCount(1, cart.FindAll(".cart-item")));
        Assert.IsEmpty(cart.FindAll(".basket-update-failed"));

        cart.Instance.UpdateQuantityId = WatchId;
        cart.Instance.UpdateQuantityValue = 3;
        var updateCartForm = cart.FindAll("form").Last();
        Assert.IsFalse(updateCartForm.ClassList.Contains("cart-quantity"));
        updateCartForm.Submit();

        cart.WaitForAssertion(() => Assert.HasCount(1, cart.FindAll("p.basket-update-failed[role=alert]")));
        Assert.AreEqual(TryAgainText, cart.Find("p.basket-update-failed[role=alert]").TextContent.Trim());
        Assert.HasCount(2, updates);
        var line = cart.Find(".cart-item");
        Assert.AreEqual(WatchName, line.QuerySelector("p.name")!.TextContent.Trim());
        Assert.AreEqual("1", line.QuerySelector("input.quantity-value")!.GetAttribute("value"));
        Assert.AreEqual("Added on 20 Nov 2026", line.QuerySelector("p.added-on")!.TextContent.Trim());

        // Step 2: the product page
        var nav = ctx.Services.GetRequiredService<NavigationManager>();
        var uriBefore = nav.Uri;
        var httpContext = new DefaultHttpContext { User = user };
        var itemPage = ctx.Render<ItemPage>(ps => ps
            .Add(p => p.ItemId, WatchId)
            .AddCascadingValue(httpContext));
        itemPage.WaitForAssertion(() => Assert.HasCount(1, itemPage.FindAll("form.add-to-cart")));
        Assert.AreEqual("Add to shopping bag", itemPage.Find("form.add-to-cart button[type=submit]").TextContent.Trim());
        Assert.IsEmpty(itemPage.FindAll(".basket-update-failed"));

        itemPage.Find("form.add-to-cart").Submit();

        itemPage.WaitForAssertion(() => Assert.HasCount(1, itemPage.FindAll("p.basket-update-failed[role=alert]")));
        Assert.AreEqual(TryAgainText, itemPage.Find("p.basket-update-failed[role=alert]").TextContent.Trim());
        Assert.HasCount(4, updates);
        Assert.AreEqual(WatchName, itemPage.Find("img.item-media-img").GetAttribute("alt"));
        Assert.AreEqual("$199.99", itemPage.Find("form.add-to-cart .price").TextContent.Trim());
        Assert.AreEqual(uriBefore, nav.Uri);
    }
}
