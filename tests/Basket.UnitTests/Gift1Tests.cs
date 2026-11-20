using System.Linq;
using System.Security.Claims;
using eShop.Basket.API.Grpc;
using eShop.Basket.API.Model;
using eShop.Basket.API.Repositories;
using eShop.Basket.UnitTests.Helpers;
using Grpc.Core;
using Microsoft.Extensions.Logging.Abstractions;
using BasketItem = eShop.Basket.API.Model.BasketItem;

namespace eShop.Basket.UnitTests;

[TestClass]
[TestCategory("GIFT-1")]
public class Gift1Tests
{
    private const string BuyerId = "1";
    private const string GiftMessage = "Happy birthday, Sam!";

    public TestContext TestContext { get; set; } = null!;

    [TestMethod]
    [TestProperty("TestCase", "TC-GIFT-1-13")]
    public async Task TC_GIFT_1_13_GetBasketReturnsEmptyGiftMessageForStoredItemWithoutMessage()
    {
        var repository = Substitute.For<IBasketRepository>();
        repository.GetBasketAsync(BuyerId).Returns(Task.FromResult(new CustomerBasket
        {
            BuyerId = BuyerId,
            Items =
            [
                new BasketItem { ProductId = 99, Quantity = 2, GiftMessage = null },
                new BasketItem { ProductId = 1, Quantity = 1, GiftMessage = GiftMessage },
            ]
        }));
        var service = new BasketService(repository, NullLogger<BasketService>.Instance);

        var response = await service.GetBasket(new GetBasketRequest(), CreateContext(BuyerId));

        Assert.HasCount(2, response.Items);
        var withoutMessage = response.Items.Single(i => i.ProductId == 99);
        Assert.AreEqual(2, withoutMessage.Quantity);
        Assert.AreEqual(string.Empty, withoutMessage.GiftMessage);
        var withMessage = response.Items.Single(i => i.ProductId == 1);
        Assert.AreEqual(1, withMessage.Quantity);
        Assert.AreEqual(GiftMessage, withMessage.GiftMessage);
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-GIFT-1-14")]
    public async Task TC_GIFT_1_14_UpdateBasketAcceptsItemWithoutGiftMessageAndStoresNoMessage()
    {
        var repository = Substitute.For<IBasketRepository>();
        repository.UpdateBasketAsync(Arg.Any<CustomerBasket>())
            .Returns(call => call.Arg<CustomerBasket>());
        var service = new BasketService(repository, NullLogger<BasketService>.Instance);
        var request = new UpdateBasketRequest();
        request.Items.Add(new eShop.Basket.API.Grpc.BasketItem { ProductId = 99, Quantity = 2 });

        var response = await service.UpdateBasket(request, CreateContext(BuyerId));

        await repository.Received(1).UpdateBasketAsync(Arg.Is<CustomerBasket>(basket =>
            basket.BuyerId == BuyerId &&
            basket.Items.Count == 1 &&
            basket.Items[0].ProductId == 99 &&
            basket.Items[0].Quantity == 2 &&
            basket.Items[0].GiftMessage == null));
        Assert.HasCount(1, response.Items);
        Assert.AreEqual(99, response.Items[0].ProductId);
        Assert.AreEqual(2, response.Items[0].Quantity);
        Assert.AreEqual(string.Empty, response.Items[0].GiftMessage);
    }

    [TestMethod]
    public async Task UpdateBasketKeepsStoredGiftMessageForItemSentWithoutTheField()
    {
        var repository = CreateRepositoryWithStoredMessage();
        var service = new BasketService(repository, NullLogger<BasketService>.Instance);
        var request = new UpdateBasketRequest();
        request.Items.Add(new eShop.Basket.API.Grpc.BasketItem { ProductId = 1, Quantity = 3 });

        var response = await service.UpdateBasket(request, CreateContext(BuyerId));

        await repository.Received(1).UpdateBasketAsync(Arg.Is<CustomerBasket>(basket =>
            basket.Items.Count == 1 && basket.Items[0].Quantity == 3 && basket.Items[0].GiftMessage == GiftMessage));
        Assert.AreEqual(GiftMessage, response.Items[0].GiftMessage);
    }

    [TestMethod]
    public async Task UpdateBasketClearsStoredGiftMessageWhenFieldIsSentEmpty()
    {
        var repository = CreateRepositoryWithStoredMessage();
        var service = new BasketService(repository, NullLogger<BasketService>.Instance);
        var request = new UpdateBasketRequest();
        request.Items.Add(new eShop.Basket.API.Grpc.BasketItem { ProductId = 1, Quantity = 1, GiftMessage = string.Empty });

        var response = await service.UpdateBasket(request, CreateContext(BuyerId));

        await repository.Received(1).UpdateBasketAsync(Arg.Is<CustomerBasket>(basket =>
            basket.Items.Count == 1 && basket.Items[0].GiftMessage == null));
        Assert.AreEqual(string.Empty, response.Items[0].GiftMessage);
    }

    [TestMethod]
    public async Task UpdateBasketRejectsOverlongGiftMessageInMixedRequestBeforeCallingRepository()
    {
        var repository = CreateRepositoryWithStoredMessage();
        var service = new BasketService(repository, NullLogger<BasketService>.Instance);
        var request = new UpdateBasketRequest();
        request.Items.Add(new eShop.Basket.API.Grpc.BasketItem { ProductId = 1, Quantity = 1 });
        request.Items.Add(new eShop.Basket.API.Grpc.BasketItem { ProductId = 2, Quantity = 1, GiftMessage = new string('a', 61) });

        var exception = await Assert.ThrowsAsync<RpcException>(() => service.UpdateBasket(request, CreateContext(BuyerId)));

        Assert.AreEqual(StatusCode.InvalidArgument, exception.StatusCode);
        Assert.IsEmpty(repository.ReceivedCalls());
    }

    private static IBasketRepository CreateRepositoryWithStoredMessage()
    {
        var repository = Substitute.For<IBasketRepository>();
        repository.GetBasketAsync(BuyerId).Returns(Task.FromResult(new CustomerBasket
        {
            BuyerId = BuyerId,
            Items = [new BasketItem { ProductId = 1, Quantity = 1, GiftMessage = GiftMessage }]
        }));
        repository.UpdateBasketAsync(Arg.Any<CustomerBasket>())
            .Returns(call => call.Arg<CustomerBasket>());
        return repository;
    }

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
}
