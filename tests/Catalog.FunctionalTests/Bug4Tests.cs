using System.Net;
using System.Net.Http.Json;
using Asp.Versioning;
using Asp.Versioning.Http;
using eShop.Catalog.API.Infrastructure;
using eShop.IntegrationEventLogEF;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace eShop.Catalog.FunctionalTests;

// BUG-4: catalog create, update and delete require a catalog admin (admin role and catalog scope); an anonymous or
// non-admin price change is refused and publishes no event.
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
    public Task TC_BUG_4_06_AnonymousPriceChangePublishesNoPriceChangedEvent() =>
        AssertPriceChangeRefused(CatalogApiFixture.AnonymousHeader, HttpStatusCode.Unauthorized);

    [Fact]
    [Trait("TestCase", "TC-BUG-4-13")]
    public Task TC_BUG_4_13_NonAdminPriceChangeIsForbiddenAndPublishesNoEvent() =>
        AssertPriceChangeRefused(CatalogApiFixture.NonAdminHeader, HttpStatusCode.Forbidden);

    [Fact]
    [Trait("TestCase", "TC-BUG-4-14")]
    public Task TC_BUG_4_14_AdminWithoutCatalogScopePriceChangeIsForbiddenAndPublishesNoEvent() =>
        AssertPriceChangeRefused(CatalogApiFixture.NoCatalogScopeHeader, HttpStatusCode.Forbidden);

    private async Task AssertPriceChangeRefused(string callerHeader, HttpStatusCode expectedStatus)
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

        // Step 1: v2 PUT that changes the price, sent as the caller under test.
        var handler = new ApiVersionHandler(new QueryStringApiVersionWriter(), new ApiVersion(2.0));
        using var client = fixture.CreateDefaultClient(handler);
        client.DefaultRequestHeaders.Add(callerHeader, "true");
        var body = new
        {
            id = ItemId,
            name = SeededName,
            description = "Unauthorized price change",
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

        Assert.Equal(expectedStatus, response.StatusCode);
        Assert.Equal(eventsBefore, eventsAfter);
        Assert.Equal(SeededPrice, stored.Price);
    }
}
