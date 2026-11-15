using System.Security.Claims;

internal static class Extensions
{
    public const string WebhooksScopePolicy = "WebhooksScope";

    private const string WebhooksScope = "webhooks";

    // The JWT handler may map "scope" to this claim type depending on its inbound claim map.
    private const string MappedScopeClaimType = "http://schemas.microsoft.com/identity/claims/scope";

    public static void AddApplicationServices(this IHostApplicationBuilder builder)
    {
        builder.AddDefaultAuthentication();

        // Only access tokens issued for this API (carrying the "webhooks" scope) may call it.
        builder.Services.AddAuthorizationBuilder()
            .AddPolicy(WebhooksScopePolicy, policy => policy
                .RequireAuthenticatedUser()
                .RequireAssertion(context => HasScope(context.User, WebhooksScope)));

        builder.AddRabbitMqEventBus("eventbus")
               .AddEventBusSubscriptions();

        builder.AddNpgsqlDbContext<WebhooksContext>("webhooksdb");

        builder.Services.AddMigration<WebhooksContext>();

        builder.Services.AddTransient<IGrantUrlTesterService, GrantUrlTesterService>();
        builder.Services.AddTransient<IWebhooksRetriever, WebhooksRetriever>();
        builder.Services.AddTransient<IWebhooksSender, WebhooksSender>();
    }

    // Scopes arrive either as one claim per scope or as a single space-delimited claim.
    private static bool HasScope(ClaimsPrincipal user, string scope) =>
        user.FindAll(c => c.Type is "scope" or MappedScopeClaimType)
            .SelectMany(c => c.Value.Split(' ', StringSplitOptions.RemoveEmptyEntries))
            .Contains(scope, StringComparer.Ordinal);

    private static void AddEventBusSubscriptions(this IEventBusBuilder eventBus)
    {
        eventBus.AddSubscription<ProductPriceChangedIntegrationEvent, ProductPriceChangedIntegrationEventHandler>();
        eventBus.AddSubscription<OrderStatusChangedToShippedIntegrationEvent, OrderStatusChangedToShippedIntegrationEventHandler>();
        eventBus.AddSubscription<OrderStatusChangedToPaidIntegrationEvent, OrderStatusChangedToPaidIntegrationEventHandler>();
    }
}
