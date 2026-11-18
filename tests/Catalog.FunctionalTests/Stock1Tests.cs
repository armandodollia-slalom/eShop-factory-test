using System.Net;
using System.Text.Json;
using Asp.Versioning;
using Asp.Versioning.Http;
using eShop.Catalog.API.Infrastructure;
using eShop.Catalog.API.Model;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace eShop.Catalog.FunctionalTests;

// STOCK-1: the onlyAvailable filter of GET /api/catalog/items (API version 2.0).
// Precondition of every case: the 101 seeded items, item 1 "Wanderer Black Hiking Boots" (brand 1 Daybird, type 1
// Footwear) and item 2 "Summit Pro Harness" (brand 2 Gravitator, type 2 Climbing) at AvailableStock 0, items 3 to
// 101 at 100. InitializeAsync sets it before each case, because the collection shares one database.
[Collection(CatalogApiCollection.Name)]
[Trait("Story", "STOCK-1")]
public sealed class Stock1Tests : IAsyncLifetime
{
    private const int SeededItemCount = 101;
    private const int InStockItemCount = 99;
    private const int OutOfStockItem1 = 1;
    private const int OutOfStockItem2 = 2;
    private const int SeededStock = 100;

    private readonly WebApplicationFactory<Program> _webApplicationFactory;
    private readonly JsonSerializerOptions _jsonSerializerOptions = new(JsonSerializerDefaults.Web);

    public Stock1Tests(CatalogApiFixture fixture)
    {
        _webApplicationFactory = fixture;
    }

    public async ValueTask InitializeAsync()
    {
        using var scope = _webApplicationFactory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<CatalogContext>();
        await context.CatalogItems
            .Where(i => i.Id <= SeededItemCount)
            .ExecuteUpdateAsync(
                s => s.SetProperty(i => i.AvailableStock, i => i.Id == OutOfStockItem1 || i.Id == OutOfStockItem2 ? 0 : SeededStock),
                TestContext.Current.CancellationToken);
    }

    public ValueTask DisposeAsync() => ValueTask.CompletedTask;

    private HttpClient CreateHttpClient(ApiVersion apiVersion)
    {
        var handler = new ApiVersionHandler(new QueryStringApiVersionWriter(), apiVersion);
        return _webApplicationFactory.CreateDefaultClient(handler);
    }

    private async Task<PaginatedItems<CatalogItem>> GetItemsAsync(HttpClient httpClient, string uri)
    {
        var response = await httpClient.GetAsync(uri, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        return JsonSerializer.Deserialize<PaginatedItems<CatalogItem>>(body, _jsonSerializerOptions);
    }

    private async Task SetStockAsync(int id, int availableStock)
    {
        using var scope = _webApplicationFactory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<CatalogContext>();
        await context.CatalogItems
            .Where(i => i.Id == id)
            .ExecuteUpdateAsync(s => s.SetProperty(i => i.AvailableStock, availableStock), TestContext.Current.CancellationToken);
    }

    private async Task<int> ReadStockAsync(int id)
    {
        using var scope = _webApplicationFactory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<CatalogContext>();
        return await context.CatalogItems
            .Where(i => i.Id == id)
            .Select(i => i.AvailableStock)
            .SingleAsync(TestContext.Current.CancellationToken);
    }

    [Fact]
    [Trait("TestCase", "TC-STOCK-1-01")]
    public async Task TC_STOCK_1_01_OnlyAvailableTrueReturnsOnlyInStockProductsAndCountsThem()
    {
        var httpClient = CreateHttpClient(new ApiVersion(2.0));

        var result = await GetItemsAsync(httpClient, "/api/catalog/items?onlyAvailable=true&pageIndex=0&pageSize=101");

        Assert.Equal(InStockItemCount, result.Count);
        Assert.Equal(InStockItemCount, result.Data.Count());
        Assert.DoesNotContain(result.Data, i => i.Id == OutOfStockItem1);
        Assert.DoesNotContain(result.Data, i => i.Id == OutOfStockItem2);
        Assert.All(result.Data, i => Assert.True(i.AvailableStock > 0, $"item {i.Id} has availableStock {i.AvailableStock}"));
    }

    [Fact]
    [Trait("TestCase", "TC-STOCK-1-02")]
    public async Task TC_STOCK_1_02_WithoutOnlyAvailableEveryProductIsReturned()
    {
        var httpClient = CreateHttpClient(new ApiVersion(2.0));

        var result = await GetItemsAsync(httpClient, "/api/catalog/items?pageIndex=0&pageSize=101");

        Assert.Equal(SeededItemCount, result.Count);
        Assert.Equal(SeededItemCount, result.Data.Count());
        Assert.Equal(0, Assert.Single(result.Data, i => i.Id == OutOfStockItem1).AvailableStock);
        Assert.Equal(0, Assert.Single(result.Data, i => i.Id == OutOfStockItem2).AvailableStock);
    }

    [Fact]
    [Trait("TestCase", "TC-STOCK-1-03")]
    public async Task TC_STOCK_1_03_OnlyAvailableFalseReturnsEveryProduct()
    {
        var httpClient = CreateHttpClient(new ApiVersion(2.0));

        var result = await GetItemsAsync(httpClient, "/api/catalog/items?onlyAvailable=false&pageIndex=0&pageSize=101");

        Assert.Equal(SeededItemCount, result.Count);
        Assert.Equal(SeededItemCount, result.Data.Count());
        Assert.Contains(result.Data, i => i.Id == OutOfStockItem1);
        Assert.Contains(result.Data, i => i.Id == OutOfStockItem2);
    }

    [Fact]
    [Trait("TestCase", "TC-STOCK-1-04")]
    public async Task TC_STOCK_1_04_OnlyAvailableCombinedWithBrandReturnsInStockItemsOfThatBrand()
    {
        const int daybird = 1;
        int[] inStockDaybirdIds = [13, 25, 39, 49, 53, 62, 71, 85, 92];
        var httpClient = CreateHttpClient(new ApiVersion(2.0));

        var result = await GetItemsAsync(httpClient, $"/api/catalog/items?onlyAvailable=true&brand={daybird}&pageIndex=0&pageSize=20");

        Assert.Equal(9, result.Count);
        Assert.Equal(inStockDaybirdIds, result.Data.Select(i => i.Id).Order());
        Assert.DoesNotContain(result.Data, i => i.Id == OutOfStockItem1);
        Assert.All(result.Data, i => Assert.Equal(daybird, i.CatalogBrandId));
    }

    [Fact]
    [Trait("TestCase", "TC-STOCK-1-05")]
    public async Task TC_STOCK_1_05_OnlyAvailableCombinedWithTypeReturnsInStockItemsOfThatType()
    {
        const int footwear = 1;
        int[] inStockFootwearIds = [19, 21, 33, 40, 41, 57, 61, 71, 75, 81, 91, 101];
        var httpClient = CreateHttpClient(new ApiVersion(2.0));

        var result = await GetItemsAsync(httpClient, $"/api/catalog/items?onlyAvailable=true&type={footwear}&pageIndex=0&pageSize=20");

        Assert.Equal(12, result.Count);
        Assert.Equal(inStockFootwearIds, result.Data.Select(i => i.Id).Order());
        Assert.DoesNotContain(result.Data, i => i.Id == OutOfStockItem1);
        Assert.All(result.Data, i => Assert.Equal(footwear, i.CatalogTypeId));
    }

    [Fact]
    [Trait("TestCase", "TC-STOCK-1-06")]
    public async Task TC_STOCK_1_06_PagingPagesOverInStockProductsOnly()
    {
        var httpClient = CreateHttpClient(new ApiVersion(2.0));

        var result = await GetItemsAsync(httpClient, "/api/catalog/items?onlyAvailable=true&pageIndex=9&pageSize=10");

        Assert.Equal(9, result.PageIndex);
        Assert.Equal(10, result.PageSize);
        Assert.Equal(InStockItemCount, result.Count);
        Assert.Equal(9, result.Data.Count());
        Assert.DoesNotContain(result.Data, i => i.Id == OutOfStockItem1);
        Assert.DoesNotContain(result.Data, i => i.Id == OutOfStockItem2);
    }

    [Fact]
    [Trait("TestCase", "TC-STOCK-1-07")]
    public async Task TC_STOCK_1_07_AvailableStockOneIsReturned()
    {
        const int alpineFusionGoggles = 3;
        const int wildRunner = 3;
        var httpClient = CreateHttpClient(new ApiVersion(2.0));

        await SetStockAsync(alpineFusionGoggles, 1);
        try
        {
            var result = await GetItemsAsync(httpClient, $"/api/catalog/items?onlyAvailable=true&brand={wildRunner}&pageIndex=0&pageSize=20");

            Assert.Equal(11, result.Count);
            Assert.Equal(1, Assert.Single(result.Data, i => i.Id == alpineFusionGoggles).AvailableStock);
        }
        finally
        {
            await SetStockAsync(alpineFusionGoggles, SeededStock);
        }

        Assert.Equal(SeededStock, await ReadStockAsync(alpineFusionGoggles));
    }

    [Fact]
    [Trait("TestCase", "TC-STOCK-1-08")]
    public async Task TC_STOCK_1_08_NegativeAvailableStockIsExcluded()
    {
        const int expeditionBackpack = 4;
        const int quester = 4;
        var httpClient = CreateHttpClient(new ApiVersion(2.0));

        await SetStockAsync(expeditionBackpack, -1);
        try
        {
            var result = await GetItemsAsync(httpClient, $"/api/catalog/items?onlyAvailable=true&brand={quester}&pageIndex=0&pageSize=20");

            Assert.Equal(3, result.Count);
            Assert.Equal(3, result.Data.Count());
            Assert.DoesNotContain(result.Data, i => i.Id == expeditionBackpack);
        }
        finally
        {
            await SetStockAsync(expeditionBackpack, SeededStock);
        }

        Assert.Equal(SeededStock, await ReadStockAsync(expeditionBackpack));
    }

    [Fact]
    [Trait("TestCase", "TC-STOCK-1-09")]
    public async Task TC_STOCK_1_09_InvalidOnlyAvailableReturns400ValidationProblem()
    {
        var httpClient = CreateHttpClient(new ApiVersion(2.0));

        var response = await httpClient.GetAsync("/api/catalog/items?onlyAvailable=maybe", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        using var problem = JsonDocument.Parse(body);
        var errors = problem.RootElement.GetProperty("errors");
        var messages = errors.GetProperty("onlyAvailable").EnumerateArray().Select(m => m.GetString()).ToList();
        Assert.NotEmpty(messages);
        Assert.All(messages, m => Assert.False(string.IsNullOrWhiteSpace(m)));
        Assert.False(problem.RootElement.TryGetProperty("data", out _));
        Assert.False(problem.RootElement.TryGetProperty("count", out _));
    }

    [Fact]
    [Trait("TestCase", "TC-STOCK-1-10")]
    public async Task TC_STOCK_1_10_ApiVersion1IgnoresOnlyAvailable()
    {
        var httpClient = CreateHttpClient(new ApiVersion(1.0));

        var result = await GetItemsAsync(httpClient, "/api/catalog/items?onlyAvailable=true&pageIndex=0&pageSize=101");

        Assert.Equal(SeededItemCount, result.Count);
        Assert.Contains(result.Data, i => i.Id == OutOfStockItem1);
        Assert.Contains(result.Data, i => i.Id == OutOfStockItem2);
    }
}
