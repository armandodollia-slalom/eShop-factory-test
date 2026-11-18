using System.Net;
using System.Text.Json;
using eShop.WebApp.Services;

namespace eShop.Application.UnitTests;

[TestClass]
[TestCategory("GIFT-1")]
public class Gift1Tests
{
    private const string GiftMessage = "Happy birthday, Sam!";

    public TestContext TestContext { get; set; } = null!;

    [TestMethod]
    [TestProperty("TestCase", "TC-GIFT-1-20")]
    public async Task TC_GIFT_1_20_OrderRequestSentToOrderingCarriesNoGiftMessage()
    {
        var handler = new CapturingHandler();
        var orderingService = new OrderingService(new HttpClient(handler) { BaseAddress = new Uri("http://ordering/") });
        var request = new CreateOrderRequest(
            UserId: "alice-id",
            UserName: "alice",
            City: "Redmond",
            Street: "15703 NE 61st Ct",
            State: "WA",
            Country: "U.S.",
            ZipCode: "98052",
            CardNumber: "1111222233334444",
            CardHolderName: "Alice Smith",
            CardExpiration: new DateTime(2030, 12, 1, 0, 0, 0, DateTimeKind.Utc),
            CardSecurityNumber: "111",
            CardTypeId: 1,
            Buyer: "alice-id",
            Items:
            [
                new BasketItem
                {
                    Id = "1",
                    ProductId = 99,
                    ProductName = "Adventurer GPS Watch",
                    UnitPrice = 10.0m,
                    Quantity = 2,
                    GiftMessage = GiftMessage,
                },
            ]);

        await orderingService.CreateOrder(request, Guid.NewGuid());

        Assert.IsNotNull(handler.Request);
        Assert.AreEqual(HttpMethod.Post, handler.Request.Method);
        Assert.AreEqual("/api/Orders/", handler.Request.RequestUri!.AbsolutePath);
        Assert.IsNotNull(handler.Body);
        using var json = JsonDocument.Parse(handler.Body);
        var root = json.RootElement;
        var items = GetPropertyIgnoreCase(root, "items");
        Assert.AreEqual(JsonValueKind.Array, items.ValueKind);
        Assert.AreEqual(1, items.GetArrayLength());
        var item = items[0];
        Assert.AreEqual(99, GetPropertyIgnoreCase(item, "productId").GetInt32());
        Assert.AreEqual(2, GetPropertyIgnoreCase(item, "quantity").GetInt32());
        Assert.IsFalse(
            item.EnumerateObject().Any(p => string.Equals(p.Name, "giftMessage", StringComparison.OrdinalIgnoreCase)),
            $"The order item must not carry a gift message: {item}");
        Assert.DoesNotContain(GiftMessage, handler.Body);
    }

    private static JsonElement GetPropertyIgnoreCase(JsonElement element, string name)
        => element.EnumerateObject().Single(p => string.Equals(p.Name, name, StringComparison.OrdinalIgnoreCase)).Value;

    private sealed class CapturingHandler : HttpMessageHandler
    {
        public HttpRequestMessage? Request { get; private set; }
        public string? Body { get; private set; }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Request = request;
            Body = request.Content is null ? null : await request.Content.ReadAsStringAsync(cancellationToken);
            return new HttpResponseMessage(HttpStatusCode.OK);
        }
    }
}
