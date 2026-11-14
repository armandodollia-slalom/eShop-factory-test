namespace eShop.Webhooks.FunctionalTests;

// One Webhooks API host (Aspire app host with Postgres and RabbitMQ) for every test class in this project.
// Two IClassFixture<WebhooksApiFixture> classes started two hosts in parallel and timed out on start-up in CI.
[CollectionDefinition(Name)]
public sealed class WebhooksApiCollection : ICollectionFixture<WebhooksApiFixture>
{
    public const string Name = "Webhooks API";
}
