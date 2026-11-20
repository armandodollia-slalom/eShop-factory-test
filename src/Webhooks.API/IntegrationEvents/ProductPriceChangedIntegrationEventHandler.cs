namespace Webhooks.API.IntegrationEvents;

public class ProductPriceChangedIntegrationEventHandler(
    IWebhooksRetriever retriever,
    IWebhooksSender sender,
    ILogger<ProductPriceChangedIntegrationEventHandler> logger) : IIntegrationEventHandler<ProductPriceChangedIntegrationEvent>
{
    public async Task Handle(ProductPriceChangedIntegrationEvent @event)
    {
        var subscriptions = await retriever.GetSubscriptionsOfType(WebhookType.CatalogItemPriceChange);

        logger.LogInformation("Received ProductPriceChangedIntegrationEvent and got {SubscriptionsCount} subscriptions to process", subscriptions.Count());

        var whook = new WebhookData(WebhookType.CatalogItemPriceChange, @event);

        await sender.SendAll(subscriptions, whook);
    }
}
