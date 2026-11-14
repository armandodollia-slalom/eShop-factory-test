using System.Text.Json.Serialization;
using eShop.Basket.API.Repositories;
using eShop.Basket.API.IntegrationEvents.EventHandling;
using eShop.Basket.API.IntegrationEvents.EventHandling.Events;

namespace eShop.Basket.API.Extensions;

public static class Extensions
{
    public const string BasketScopePolicy = "BasketScope";

    private const string BasketScope = "basket";

    public static void AddApplicationServices(this IHostApplicationBuilder builder)
    {
        builder.AddDefaultAuthentication();

        // Identity.API issues tokens for every API from the same authority, so a valid token
        // alone is not enough: the caller must have been granted the basket scope.
        builder.Services.AddAuthorizationBuilder()
            .AddPolicy(BasketScopePolicy, policy => policy
                .RequireAuthenticatedUser()
                .RequireAssertion(context => HasBasketScope(context.User)));

        builder.AddRedisClient("redis");

        builder.Services.AddSingleton<IBasketRepository, RedisBasketRepository>();

        builder.AddRabbitMqEventBus("eventbus")
               .AddSubscription<OrderStartedIntegrationEvent, OrderStartedIntegrationEventHandler>()
               .ConfigureJsonOptions(options => options.TypeInfoResolverChain.Add(IntegrationEventContext.Default));
    }

    // A JWT carries its scopes either as one "scope" claim per scope (JSON array)
    // or as a single space-separated "scope" value.
    internal static bool HasBasketScope(ClaimsPrincipal user) =>
        user.FindAll("scope")
            .SelectMany(claim => claim.Value.Split(' ', StringSplitOptions.RemoveEmptyEntries))
            .Contains(BasketScope, StringComparer.Ordinal);
}

[JsonSerializable(typeof(OrderStartedIntegrationEvent))]
partial class IntegrationEventContext : JsonSerializerContext
{

}
