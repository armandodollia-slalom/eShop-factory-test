using System.Text.Json;
using Microsoft.Extensions.Logging.Abstractions;
using Webhooks.API.IntegrationEvents;
using Webhooks.API.Model;
using Webhooks.API.Services;

namespace eShop.Application.UnitTests;

[TestClass]
[TestCategory("BUG-53")]
public class Bug53WebhookHandlerTests
{
    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-53-02")]
    public async Task TC_BUG_53_02_PriceChangeHandlerSendsCatalogItemPriceChangePayloadToItsSubscriptions()
    {
        var subscription = new WebhookSubscription
        {
            Type = WebhookType.CatalogItemPriceChange,
            DestUrl = "http://receiver/hook",
            Token = "t1"
        };
        var (retriever, sender) = Substitutes(WebhookType.CatalogItemPriceChange, subscription);
        var handler = new ProductPriceChangedIntegrationEventHandler(
            retriever, sender, NullLogger<ProductPriceChangedIntegrationEventHandler>.Instance);

        await handler.Handle(new ProductPriceChangedIntegrationEvent(99, 149.99m, 199.99m));

        await retriever.Received(1).GetSubscriptionsOfType(Arg.Any<WebhookType>());
        await retriever.Received(1).GetSubscriptionsOfType(WebhookType.CatalogItemPriceChange);
        var (receivers, data) = SingleSendAll(sender);
        Assert.HasCount(1, receivers);
        Assert.AreSame(subscription, receivers[0]);
        Assert.AreEqual("CatalogItemPriceChange", data.Type);
        using var payload = JsonDocument.Parse(data.Payload);
        Assert.AreEqual(99, payload.RootElement.GetProperty("ProductId").GetInt32());
        Assert.AreEqual(149.99m, payload.RootElement.GetProperty("NewPrice").GetDecimal());
        Assert.AreEqual(199.99m, payload.RootElement.GetProperty("OldPrice").GetDecimal());
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-53-05")]
    public async Task TC_BUG_53_05_OrderPaidHandlerStillSendsOrderPaidToItsSubscriptions()
    {
        var subscription = new WebhookSubscription
        {
            Type = WebhookType.OrderPaid,
            DestUrl = "http://receiver/paid",
            Token = "paid"
        };
        var (retriever, sender) = Substitutes(WebhookType.OrderPaid, subscription);
        var handler = new OrderStatusChangedToPaidIntegrationEventHandler(
            retriever, sender, NullLogger<OrderStatusChangedToShippedIntegrationEventHandler>.Instance);

        await handler.Handle(new OrderStatusChangedToPaidIntegrationEvent(7, []));

        await retriever.Received(1).GetSubscriptionsOfType(Arg.Any<WebhookType>());
        await retriever.Received(1).GetSubscriptionsOfType(WebhookType.OrderPaid);
        var (receivers, data) = SingleSendAll(sender);
        Assert.HasCount(1, receivers);
        Assert.AreSame(subscription, receivers[0]);
        Assert.AreEqual("OrderPaid", data.Type);
        using var payload = JsonDocument.Parse(data.Payload);
        Assert.AreEqual(7, payload.RootElement.GetProperty("OrderId").GetInt32());
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-53-06")]
    public async Task TC_BUG_53_06_OrderShippedHandlerStillSendsOrderShippedToItsSubscriptions()
    {
        var subscription = new WebhookSubscription
        {
            Type = WebhookType.OrderShipped,
            DestUrl = "http://receiver/shipped",
            Token = "shipped"
        };
        var (retriever, sender) = Substitutes(WebhookType.OrderShipped, subscription);
        var handler = new OrderStatusChangedToShippedIntegrationEventHandler(
            retriever, sender, NullLogger<OrderStatusChangedToShippedIntegrationEventHandler>.Instance);

        await handler.Handle(new OrderStatusChangedToShippedIntegrationEvent(8, "Shipped", "alice"));

        await retriever.Received(1).GetSubscriptionsOfType(Arg.Any<WebhookType>());
        await retriever.Received(1).GetSubscriptionsOfType(WebhookType.OrderShipped);
        var (receivers, data) = SingleSendAll(sender);
        Assert.HasCount(1, receivers);
        Assert.AreSame(subscription, receivers[0]);
        Assert.AreEqual("OrderShipped", data.Type);
        using var payload = JsonDocument.Parse(data.Payload);
        Assert.AreEqual(8, payload.RootElement.GetProperty("OrderId").GetInt32());
    }

    // The retriever returns the one subscription for its type and an empty list for every other type.
    private static (IWebhooksRetriever Retriever, IWebhooksSender Sender) Substitutes(WebhookType type, WebhookSubscription subscription)
    {
        var retriever = Substitute.For<IWebhooksRetriever>();
        retriever.GetSubscriptionsOfType(Arg.Any<WebhookType>())
            .Returns(call => Task.FromResult<IEnumerable<WebhookSubscription>>(
                call.Arg<WebhookType>() == type ? [subscription] : []));
        return (retriever, Substitute.For<IWebhooksSender>());
    }

    private static (List<WebhookSubscription> Receivers, WebhookData Data) SingleSendAll(IWebhooksSender sender)
    {
        var calls = sender.ReceivedCalls().Where(c => c.GetMethodInfo().Name == nameof(IWebhooksSender.SendAll)).ToList();
        Assert.HasCount(1, calls);
        var arguments = calls[0].GetArguments();
        return (((IEnumerable<WebhookSubscription>)arguments[0]!).ToList(), (WebhookData)arguments[1]!);
    }
}
