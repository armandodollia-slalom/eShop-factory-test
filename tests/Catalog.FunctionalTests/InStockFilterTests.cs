using System.IO;
using System.Net;
using System.Text.Json;
using System.Threading;
using Asp.Versioning;
using Asp.Versioning.Http;
using eShop.Catalog.API.Infrastructure;
using eShop.Catalog.API.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace eShop.Catalog.FunctionalTests;

// Shares the project's Catalog API host. CatalogApiTests deletes items 5 and 6 and adds items 10015 and 10016,
// so each test first puts the catalog's rows back to the demo catalog (Setup/catalog.json) and then applies the
// INSTK-1 stock set; DisposeAsync gives every item its seeded stock of 100 again.
[Collection(CatalogApiCollection.Name)]
[Trait("Story", "INSTK-1")]
public sealed class InStockFilterTests : IAsyncLifetime
{
    // The INSTK-1 stock set (plan _index.md, same values as .factory/stack/scenarios/instk-1/stock.sql).
    private static readonly int[] OutOfStockIds = [53, 92, 13, 5, 32, 26, 4, 8, 9, 10, 19];
    private const int LastUnitId = 71;

    private readonly CatalogApiFixture _fixture;
    private readonly JsonSerializerOptions _jsonSerializerOptions = new(JsonSerializerDefaults.Web);

    public InStockFilterTests(CatalogApiFixture fixture)
    {
        _fixture = fixture;
    }

    public async ValueTask InitializeAsync()
    {
        // Resolving the services starts the host, which migrates and seeds the demo catalog first.
        using var scope = _fixture.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<CatalogContext>();
        var environment = scope.ServiceProvider.GetRequiredService<IWebHostEnvironment>();
        var ct = TestContext.Current.CancellationToken;

        await RestoreDemoCatalogRowsAsync(context, environment, ct);

        await context.CatalogItems.Where(i => OutOfStockIds.Contains(i.Id))
            .ExecuteUpdateAsync(s => s.SetProperty(i => i.AvailableStock, 0), ct);
        await context.CatalogItems.Where(i => i.Id == LastUnitId)
            .ExecuteUpdateAsync(s => s.SetProperty(i => i.AvailableStock, 1), ct);
        await context.CatalogItems.Where(i => !OutOfStockIds.Contains(i.Id) && i.Id != LastUnitId)
            .ExecuteUpdateAsync(s => s.SetProperty(i => i.AvailableStock, 100), ct);
    }

    public async ValueTask DisposeAsync()
    {
        using var scope = _fixture.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<CatalogContext>();
        await context.CatalogItems.ExecuteUpdateAsync(s => s.SetProperty(i => i.AvailableStock, 100));
    }

    private static async Task RestoreDemoCatalogRowsAsync(CatalogContext context, IWebHostEnvironment environment, CancellationToken ct)
    {
        var sourcePath = Path.Combine(environment.ContentRootPath, "Setup", "catalog.json");
        var demoItems = JsonSerializer.Deserialize<DemoCatalogEntry[]>(await File.ReadAllTextAsync(sourcePath, ct));
        var demoIds = demoItems.Select(d => d.Id).ToArray();

        await context.CatalogItems.Where(i => !demoIds.Contains(i.Id)).ExecuteDeleteAsync(ct);

        var presentIds = await context.CatalogItems.Select(i => i.Id).ToListAsync(ct);
        var missing = demoItems.Where(d => !presentIds.Contains(d.Id)).ToList();
        if (missing.Count == 0)
        {
            return;
        }

        var brandIds = await context.CatalogBrands.ToDictionaryAsync(b => b.Brand, b => b.Id, ct);
        var typeIds = await context.CatalogTypes.ToDictionaryAsync(t => t.Type, t => t.Id, ct);
        context.CatalogItems.AddRange(missing.Select(d => new CatalogItem(d.Name)
        {
            Id = d.Id,
            Description = d.Description,
            Price = d.Price,
            CatalogBrandId = brandIds[d.Brand],
            CatalogTypeId = typeIds[d.Type],
            AvailableStock = 100,
            MaxStockThreshold = 200,
            RestockThreshold = 10,
            PictureFileName = $"{d.Id}.webp",
        }));
        await context.SaveChangesAsync(ct);
    }

    private sealed record DemoCatalogEntry(int Id, string Type, string Brand, string Name, string Description, decimal Price);

    private HttpClient CreateHttpClient(ApiVersion apiVersion)
    {
        var handler = new ApiVersionHandler(new QueryStringApiVersionWriter(), apiVersion);
        return _fixture.CreateDefaultClient(handler);
    }

    private async Task<(HttpStatusCode Status, PaginatedItems<CatalogItem> Page)> GetItemsAsync(double version, string query)
    {
        using var client = CreateHttpClient(new ApiVersion(version));
        var response = await client.GetAsync($"/api/catalog/items?{query}", TestContext.Current.CancellationToken);
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        return (response.StatusCode, JsonSerializer.Deserialize<PaginatedItems<CatalogItem>>(body, _jsonSerializerOptions));
    }

    [Fact]
    [Trait("TestCase", "TC-INSTK-1-01")]
    public async Task TC_INSTK_1_01_InStockTrueReturnsAndCountsOnlyInStockItems()
    {
        var (status, page) = await GetItemsAsync(2.0, "inStock=true&PageSize=100&PageIndex=0");

        Assert.Equal(HttpStatusCode.OK, status);
        Assert.Equal(90, page.Count);
        Assert.Equal(0, page.PageIndex);
        Assert.Equal(100, page.PageSize);
        var items = page.Data.ToList();
        Assert.Equal(90, items.Count);
        Assert.DoesNotContain(items, i => i.AvailableStock == 0);
        Assert.Empty(items.Select(i => i.Id).Intersect(OutOfStockIds));
        Assert.All(items, i => Assert.True(i.AvailableStock > 0, $"item {i.Id} has AvailableStock {i.AvailableStock}"));
    }

    [Fact]
    [Trait("TestCase", "TC-INSTK-1-02")]
    public async Task TC_INSTK_1_02_OneUnitIsListedZeroUnitsIsNot()
    {
        var (status, page) = await GetItemsAsync(2.0, "inStock=true&brand=1&PageSize=20&PageIndex=0");

        Assert.Equal(HttpStatusCode.OK, status);
        Assert.Equal(7, page.Count);
        var items = page.Data.ToList();
        Assert.Equal(new[] { 1, 25, 39, 49, 62, 71, 85 }, items.Select(i => i.Id).Order().ToArray());
        var lastUnit = Assert.Single(items, i => i.Id == LastUnitId);
        Assert.Equal(1, lastUnit.AvailableStock);
        Assert.DoesNotContain(items, i => i.Id is 13 or 53 or 92);
    }

    [Fact]
    [Trait("TestCase", "TC-INSTK-1-05")]
    public async Task TC_INSTK_1_05_WithoutInStockListIsUnchanged()
    {
        var (status, page) = await GetItemsAsync(2.0, "PageSize=101&PageIndex=0");

        Assert.Equal(HttpStatusCode.OK, status);
        Assert.Equal(101, page.Count);
        var items = page.Data.ToList();
        Assert.Equal(101, items.Count);
        foreach (var id in OutOfStockIds)
        {
            var item = Assert.Single(items, i => i.Id == id);
            Assert.Equal(0, item.AvailableStock);
        }
        // Ordered by name with the database's collation, read straight from the catalog table.
        using var scope = _fixture.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<CatalogContext>();
        var namesInOrder = await context.CatalogItems.OrderBy(i => i.Name).Select(i => i.Name)
            .ToListAsync(TestContext.Current.CancellationToken);
        Assert.Equal(namesInOrder, items.Select(i => i.Name).ToList());
    }

    [Fact]
    [Trait("TestCase", "TC-INSTK-1-06")]
    public async Task TC_INSTK_1_06_InStockFalseListsEveryItem()
    {
        var (status, page) = await GetItemsAsync(2.0, "inStock=false&PageSize=101&PageIndex=0");

        Assert.Equal(HttpStatusCode.OK, status);
        Assert.Equal(101, page.Count);
        var ids = page.Data.Select(i => i.Id).ToList();
        Assert.Equal(101, ids.Count);
        Assert.Subset(ids.ToHashSet(), OutOfStockIds.ToHashSet());
        Assert.Contains(LastUnitId, ids);
    }

    [Fact]
    [Trait("TestCase", "TC-INSTK-1-07")]
    public async Task TC_INSTK_1_07_V1IgnoresInStock()
    {
        var (status, page) = await GetItemsAsync(1.0, "inStock=true&PageSize=101&PageIndex=0");

        Assert.Equal(HttpStatusCode.OK, status);
        Assert.Equal(101, page.Count);
        var ids = page.Data.Select(i => i.Id).ToList();
        Assert.Equal(101, ids.Count);
        Assert.Subset(ids.ToHashSet(), OutOfStockIds.ToHashSet());
    }

    [Fact]
    [Trait("TestCase", "TC-INSTK-1-08")]
    public async Task TC_INSTK_1_08_OpenApiV2DescribesInStockV1DoesNot()
    {
        using var client = _fixture.CreateDefaultClient();
        var ct = TestContext.Current.CancellationToken;

        var v2Response = await client.GetAsync("openapi/v2.json", ct);
        var v1Response = await client.GetAsync("openapi/v1.json", ct);

        Assert.Equal(HttpStatusCode.OK, v2Response.StatusCode);
        Assert.Equal(HttpStatusCode.OK, v1Response.StatusCode);
        Assert.Equal("application/json", v2Response.Content.Headers.ContentType?.MediaType);
        Assert.Equal("application/json", v1Response.Content.Headers.ContentType?.MediaType);
        using var v2 = JsonDocument.Parse(await v2Response.Content.ReadAsStringAsync(ct));
        using var v1 = JsonDocument.Parse(await v1Response.Content.ReadAsStringAsync(ct));
        Assert.StartsWith("3.", v2.RootElement.GetProperty("openapi").GetString());
        Assert.StartsWith("3.", v1.RootElement.GetProperty("openapi").GetString());

        var v2InStock = Assert.Single(ItemsListParameters(v2), p => p.GetProperty("name").GetString() == "inStock");
        Assert.Equal("query", v2InStock.GetProperty("in").GetString());
        Assert.False(v2InStock.TryGetProperty("required", out var required) && required.GetBoolean());
        Assert.Equal("boolean", v2InStock.GetProperty("schema").GetProperty("type").GetString());

        Assert.DoesNotContain(ItemsListParameters(v1), p => p.GetProperty("name").GetString() == "inStock");
    }

    private static List<JsonElement> ItemsListParameters(JsonDocument document) =>
        document.RootElement.GetProperty("paths").GetProperty("/api/catalog/items").GetProperty("get")
            .GetProperty("parameters").EnumerateArray().ToList();
}
