using System.Net;
using System.Text.Json;
using eShop.Catalog.API.Infrastructure;
using eShop.Catalog.API.Model;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace eShop.Catalog.FunctionalTests;

// A Catalog.API host of its own on a database of its own ("brandsummary") in the collection's Postgres container,
// migrated and seeded with the demo catalog at startup. CatalogApiTests reprices, deletes and adds items in the
// fixture's database, never in this one, so the exact per-brand values below are read from the unchanged demo catalog.
public sealed class BrandSummaryCatalog(CatalogApiFixture shared) : WebApplicationFactory<Program>, IAsyncLifetime
{
    private string _connectionString;

    public async ValueTask InitializeAsync()
    {
        var server = new NpgsqlConnectionStringBuilder(await shared.Postgres.Resource.GetConnectionStringAsync()) { Database = "brandsummary" };
        _connectionString = server.ConnectionString;
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        builder.ConfigureHostConfiguration(config =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string>
            {
                { $"ConnectionStrings:{shared.Postgres.Resource.Name}", _connectionString },
            });
        });
        return base.CreateHost(builder);
    }
}

[Collection(CatalogApiCollection.Name)]
[Trait("Story", "BRAND-1")]
public sealed class BrandSummaryTests : IClassFixture<BrandSummaryCatalog>
{
    private const string SummaryUrl = "/api/catalog/catalogbrands/summary?api-version=1.0";

    private readonly BrandSummaryCatalog _fixture;

    public BrandSummaryTests(BrandSummaryCatalog fixture)
    {
        _fixture = fixture;
    }

    private async Task<(HttpResponseMessage Response, JsonElement[] Brands)> GetSummaryAsync()
    {
        var client = _fixture.CreateClient();
        var response = await client.GetAsync(SummaryUrl, TestContext.Current.CancellationToken);
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        using var document = JsonDocument.Parse(body);
        Assert.Equal(JsonValueKind.Array, document.RootElement.ValueKind);
        return (response, document.RootElement.EnumerateArray().Select(e => e.Clone()).ToArray());
    }

    [Fact]
    [Trait("TestCase", "TC-BRAND-1-01")]
    public async Task TC_BRAND_1_01_SummaryReturnsEveryBrandOnceOrderedByNameWithFourFields()
    {
        var (response, brands) = await GetSummaryAsync();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal(13, brands.Length);
        foreach (var brand in brands)
        {
            Assert.Equal(
                new[] { "brand", "id", "itemCount", "lowestPrice" },
                brand.EnumerateObject().Select(p => p.Name).Order(StringComparer.Ordinal).ToArray());
        }

        var expected = new (int Id, string Brand)[]
        {
            (9, "AirStrider"), (5, "B&R"), (1, "Daybird"), (2, "Gravitator"), (10, "Green Equipment"),
            (8, "Grolltex"), (12, "Legend"), (4, "Quester"), (6, "Raptor Elite"), (7, "Solstix"),
            (3, "WildRunner"), (13, "XE"), (11, "Zephyr"),
        };
        Assert.Equal(expected, brands.Select(b => (b.GetProperty("id").GetInt32(), b.GetProperty("brand").GetString())).ToArray());
        Assert.Equal(brands.Length, brands.Select(b => b.GetProperty("id").GetInt32()).Distinct().Count());
    }

    [Fact]
    [Trait("TestCase", "TC-BRAND-1-02")]
    public async Task TC_BRAND_1_02_SummaryReturnsEachBrandsItemCountAndLowestPrice()
    {
        var (response, brands) = await GetSummaryAsync();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var expected = new Dictionary<int, (int ItemCount, decimal LowestPrice)>
        {
            [1] = (10, 49.99m),
            [2] = (11, 59.99m),
            [3] = (11, 69.99m),
            [4] = (4, 49.99m),
            [5] = (10, 59.99m),
            [6] = (11, 69.99m),
            [7] = (9, 89.00m),
            [8] = (5, 29.99m),
            [9] = (6, 54.99m),
            [10] = (7, 59.99m),
            [11] = (6, 109.99m),
            [12] = (8, 21.99m),
            [13] = (3, 199.00m),
        };
        Assert.All(brands, b => Assert.NotEqual(JsonValueKind.Null, b.GetProperty("lowestPrice").ValueKind));
        var actual = brands.ToDictionary(
            b => b.GetProperty("id").GetInt32(),
            b => (b.GetProperty("itemCount").GetInt32(), b.GetProperty("lowestPrice").GetDecimal()));
        Assert.Equal(expected.OrderBy(e => e.Key), actual.OrderBy(a => a.Key));

        var total = brands.Sum(b => b.GetProperty("itemCount").GetInt32());
        Assert.Equal(101, total);
        var itemsResponse = await _fixture.CreateClient().GetAsync("/api/catalog/items?api-version=1.0&pageSize=1", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, itemsResponse.StatusCode);
        using var items = JsonDocument.Parse(await itemsResponse.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.Equal(total, items.RootElement.GetProperty("count").GetInt64());
    }

    [Fact]
    [Trait("TestCase", "TC-BRAND-1-03")]
    public async Task TC_BRAND_1_03_SummaryReturnsZeroCountAndNullPriceForBrandWithoutProducts()
    {
        // Created through the host's CatalogContext so the endpoint reads it from the same database; removed afterwards
        // so the other cases of this class still see only the demo catalog.
        using (var scope = _fixture.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<CatalogContext>();
            context.CatalogBrands.Add(new CatalogBrand("Acme Empty") { Id = 14 });
            await context.SaveChangesAsync(TestContext.Current.CancellationToken);
        }

        try
        {
            var (response, brands) = await GetSummaryAsync();

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.Equal(14, brands.Length);
            var empty = brands[0];
            Assert.Equal(
                new[] { "brand", "id", "itemCount", "lowestPrice" },
                empty.EnumerateObject().Select(p => p.Name).Order(StringComparer.Ordinal).ToArray());
            Assert.Equal(14, empty.GetProperty("id").GetInt32());
            Assert.Equal("Acme Empty", empty.GetProperty("brand").GetString());
            Assert.Equal(0, empty.GetProperty("itemCount").GetInt32());
            Assert.Equal(JsonValueKind.Null, empty.GetProperty("lowestPrice").ValueKind);
            Assert.Equal("AirStrider", brands[1].GetProperty("brand").GetString());
            Assert.Single(brands, b => b.GetProperty("id").GetInt32() == 14);
            Assert.Equal(101, brands.Sum(b => b.GetProperty("itemCount").GetInt32()));
        }
        finally
        {
            using var scope = _fixture.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<CatalogContext>();
            var added = await context.CatalogBrands.FindAsync([14], TestContext.Current.CancellationToken);
            if (added is not null)
            {
                context.CatalogBrands.Remove(added);
                await context.SaveChangesAsync(TestContext.Current.CancellationToken);
            }
        }
    }

    private static readonly (int Id, string Brand)[] NameOrder =
    [
        (9, "AirStrider"), (5, "B&R"), (1, "Daybird"), (2, "Gravitator"), (10, "Green Equipment"),
        (8, "Grolltex"), (12, "Legend"), (4, "Quester"), (6, "Raptor Elite"), (7, "Solstix"),
        (3, "WildRunner"), (13, "XE"), (11, "Zephyr"),
    ];

    private async Task<(HttpResponseMessage Response, string Body)> GetAsync(string url)
    {
        var client = _fixture.CreateClient();
        var response = await client.GetAsync(url, TestContext.Current.CancellationToken);
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        return (response, body);
    }

    private static JsonElement[] ParseBrands(string body)
    {
        using var document = JsonDocument.Parse(body);
        Assert.Equal(JsonValueKind.Array, document.RootElement.ValueKind);
        return document.RootElement.EnumerateArray().Select(e => e.Clone()).ToArray();
    }

    private static (int, string) IdAndBrand(JsonElement b) => (b.GetProperty("id").GetInt32(), b.GetProperty("brand").GetString());

    private static void AssertSortProblem(HttpResponseMessage response, string body)
    {
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        using var document = JsonDocument.Parse(body);
        Assert.Equal(JsonValueKind.Object, document.RootElement.ValueKind);
        Assert.Equal(400, document.RootElement.GetProperty("status").GetInt32());
        var detail = document.RootElement.GetProperty("detail").GetString();
        Assert.Contains("name", detail);
        Assert.Contains("count", detail);
    }

    [Fact]
    [Trait("Story", "BRAND-3")]
    [Trait("TestCase", "TC-BRAND-3-01")]
    public async Task TC_BRAND_3_01_SummarySortedByCountOrdersByItemCountDescendingThenName()
    {
        var (response, body) = await GetAsync($"{SummaryUrl}&sort=count");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
        var brands = ParseBrands(body);
        var expected = new (int Id, string Brand, int ItemCount)[]
        {
            (2, "Gravitator", 11), (6, "Raptor Elite", 11), (3, "WildRunner", 11), (5, "B&R", 10), (1, "Daybird", 10),
            (7, "Solstix", 9), (12, "Legend", 8), (10, "Green Equipment", 7), (9, "AirStrider", 6), (11, "Zephyr", 6),
            (8, "Grolltex", 5), (4, "Quester", 4), (13, "XE", 3),
        };
        Assert.Equal(13, brands.Length);
        Assert.Equal(
            expected,
            brands.Select(b => (b.GetProperty("id").GetInt32(), b.GetProperty("brand").GetString(), b.GetProperty("itemCount").GetInt32())).ToArray());

        // Sorting changes only the order: every entry's lowest price equals the one of the unsorted response.
        var (unsortedResponse, unsortedBody) = await GetAsync(SummaryUrl);
        Assert.Equal(HttpStatusCode.OK, unsortedResponse.StatusCode);
        var unsortedPrices = ParseBrands(unsortedBody).ToDictionary(b => b.GetProperty("id").GetInt32(), b => b.GetProperty("lowestPrice").GetDecimal());
        Assert.All(brands, b => Assert.Equal(unsortedPrices[b.GetProperty("id").GetInt32()], b.GetProperty("lowestPrice").GetDecimal()));
        Assert.Equal(59.99m, brands[0].GetProperty("lowestPrice").GetDecimal());
        Assert.Equal(199.00m, brands[^1].GetProperty("lowestPrice").GetDecimal());
    }

    [Fact]
    [Trait("Story", "BRAND-3")]
    [Trait("TestCase", "TC-BRAND-3-02")]
    public async Task TC_BRAND_3_02_SummarySortedByNameOrdersBrandsAlphabetically()
    {
        var (response, body) = await GetAsync($"{SummaryUrl}&sort=name");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var brands = ParseBrands(body);
        Assert.Equal(13, brands.Length);
        Assert.Equal(NameOrder, brands.Select(IdAndBrand).ToArray());
    }

    [Fact]
    [Trait("Story", "BRAND-3")]
    [Trait("TestCase", "TC-BRAND-3-03")]
    public async Task TC_BRAND_3_03_SummaryWithoutSortKeepsAlphabeticalOrder()
    {
        var (response, body) = await GetAsync(SummaryUrl);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var brands = ParseBrands(body);
        Assert.Equal(13, brands.Length);
        Assert.Equal(NameOrder, brands.Select(IdAndBrand).ToArray());
    }

    [Fact]
    [Trait("Story", "BRAND-3")]
    [Trait("TestCase", "TC-BRAND-3-04")]
    public async Task TC_BRAND_3_04_SummaryWithUnknownSortAnswers400ProblemNamingNameAndCount()
    {
        var (response, body) = await GetAsync($"{SummaryUrl}&sort=price");

        AssertSortProblem(response, body);
        using var document = JsonDocument.Parse(body);
        Assert.NotEqual(JsonValueKind.Array, document.RootElement.ValueKind);
        Assert.False(document.RootElement.TryGetProperty("id", out _));
        Assert.False(document.RootElement.TryGetProperty("brand", out _));
        Assert.False(document.RootElement.TryGetProperty("itemCount", out _));
    }

    [Fact]
    [Trait("Story", "BRAND-3")]
    [Trait("TestCase", "TC-BRAND-3-05")]
    public async Task TC_BRAND_3_05_SummaryWithEmptySortAnswers400()
    {
        var (response, body) = await GetAsync($"{SummaryUrl}&sort=");

        AssertSortProblem(response, body);
    }

    [Fact]
    [Trait("Story", "BRAND-3")]
    [Trait("TestCase", "TC-BRAND-3-06")]
    public async Task TC_BRAND_3_06_SummaryWithUppercaseCountAnswers400()
    {
        var (response, body) = await GetAsync($"{SummaryUrl}&sort=COUNT");

        AssertSortProblem(response, body);
    }
}
