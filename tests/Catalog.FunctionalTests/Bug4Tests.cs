using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Asp.Versioning;
using Asp.Versioning.Http;
using eShop.Catalog.API.Infrastructure;
using eShop.IntegrationEventLogEF;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace eShop.Catalog.FunctionalTests;

// BUG-4: catalog create, update and delete require a catalog admin; an anonymous price change is refused and
// publishes no event.
[Trait("Story", "BUG-4")]
[Collection(CatalogApiCollection.Name)]
public sealed class Bug4Tests(CatalogApiFixture fixture)
{
    private const int ItemId = 1;
    private const string SeededName = "Wanderer Black Hiking Boots";
    private const decimal SeededPrice = 109.99m;
    private const string PriceChangedEvent = "ProductPriceChangedIntegrationEvent";

    private static async Task<int> CountPriceChangedEvents(CatalogContext context) =>
        await context.Set<IntegrationEventLogEntry>()
            .CountAsync(e => e.EventTypeName.Contains(PriceChangedEvent), TestContext.Current.CancellationToken);

    [Fact]
    [Trait("TestCase", "TC-BUG-4-06")]
    public async Task TC_BUG_4_06_AnonymousPriceChangePublishesNoPriceChangedEvent()
    {
        var cancellationToken = TestContext.Current.CancellationToken;
        using var scope = fixture.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<CatalogContext>();

        // Precondition: item 1 carries its seeded price (other tests in the collection change it), and N events are logged.
        var seeded = await context.CatalogItems.SingleAsync(i => i.Id == ItemId, cancellationToken);
        seeded.Price = SeededPrice;
        await context.SaveChangesAsync(cancellationToken);
        context.ChangeTracker.Clear();
        var eventsBefore = await CountPriceChangedEvents(context);

        // Step 1: v2 PUT that changes the price, sent with no test identity and no Authorization header.
        var handler = new ApiVersionHandler(new QueryStringApiVersionWriter(), new ApiVersion(2.0));
        using var client = fixture.CreateDefaultClient(handler);
        client.DefaultRequestHeaders.Add(CatalogApiFixture.AnonymousHeader, "true");
        var body = new
        {
            id = ItemId,
            name = SeededName,
            description = "Anonymous price change",
            price = 1.00m,
            pictureFileName = "1.webp",
            catalogTypeId = 1,
            catalogBrandId = 1,
            availableStock = 100,
            restockThreshold = 10,
            maxStockThreshold = 200,
            onReorder = false
        };
        var response = await client.PutAsJsonAsync($"/api/catalog/items/{ItemId}", body, cancellationToken);

        // Step 2: no new ProductPriceChangedIntegrationEvent row. Step 3: the stored price is unchanged.
        var eventsAfter = await CountPriceChangedEvents(context);
        var stored = await context.CatalogItems.AsNoTracking().SingleAsync(i => i.Id == ItemId, cancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal(eventsBefore, eventsAfter);
        Assert.Equal(SeededPrice, stored.Price);
    }

    [Theory]
    [InlineData("v1", "/api/catalog/items", "put")]
    [InlineData("v1", "/api/catalog/items", "post")]
    [InlineData("v1", "/api/catalog/items/{id}", "delete")]
    [InlineData("v2", "/api/catalog/items/{id}", "put")]
    [InlineData("v2", "/api/catalog/items", "post")]
    [InlineData("v2", "/api/catalog/items/{id}", "delete")]
    public async Task OpenApiDocumentRequiresTheOAuth2CatalogScopeOnWriteOperations(string version, string path, string method)
    {
        using var client = fixture.CreateDefaultClient();

        var document = await client.GetFromJsonAsync<JsonObject>($"/openapi/{version}.json", TestContext.Current.CancellationToken);

        // An empty requirement object ("security": [ { } ]) would mean anonymous access is allowed.
        var security = Assert.IsType<JsonArray>(document!["paths"]![path]![method]!["security"]);
        var requirement = Assert.IsType<JsonObject>(Assert.Single(security));
        var scopes = Assert.IsType<JsonArray>(requirement["oauth2"]);
        Assert.Equal("catalog", Assert.Single(scopes)!.GetValue<string>());
    }
}
