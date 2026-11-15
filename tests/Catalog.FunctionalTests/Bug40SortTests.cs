using System.Net;
using System.Text.Json;
using Asp.Versioning;
using Asp.Versioning.Http;
using eShop.Catalog.API.Model;
using Microsoft.AspNetCore.Mvc.Testing;

namespace eShop.Catalog.FunctionalTests;

// BUG-40: v2 GET /api/catalog/items sorts the whole (filtered) catalog before paging (`sort` = name-asc, name-desc,
// price-asc, price-desc; unknown values fall back to name-asc). The cases assert exact ids of the seeded 101 items
// (src/Catalog.API/Setup/catalog.json) through the project's shared CatalogApiFixture; the other tests of the collection
// restore every row they change, and these tests only read.
[Collection(CatalogApiCollection.Name)]
[Trait("Story", "BUG-40")]
public sealed class Bug40SortTests
{
    private const int TotalItems = 101;
    private const int PageSize = 9;
    private const int PageCount = 12;
    private static readonly int[] DefaultPage0Ids = [99, 95, 88, 3, 28, 18, 17, 74, 49];

    private readonly WebApplicationFactory<Program> _webApplicationFactory;
    private readonly JsonSerializerOptions _jsonSerializerOptions = new(JsonSerializerDefaults.Web);

    public Bug40SortTests(CatalogApiFixture fixture)
    {
        _webApplicationFactory = fixture;
    }

    private HttpClient CreateHttpClient()
    {
        var handler = new ApiVersionHandler(new QueryStringApiVersionWriter(), new ApiVersion(2.0));
        return _webApplicationFactory.CreateDefaultClient(handler);
    }

    private async Task<PaginatedItems<CatalogItem>> GetItemsAsync(HttpClient httpClient, string query)
    {
        var response = await httpClient.GetAsync($"/api/catalog/items?{query}", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        return JsonSerializer.Deserialize<PaginatedItems<CatalogItem>>(body, _jsonSerializerOptions);
    }

    private async Task<List<PaginatedItems<CatalogItem>>> GetAllPagesAsync(string sort)
    {
        var httpClient = CreateHttpClient();
        var pages = new List<PaginatedItems<CatalogItem>>();
        for (var pageIndex = 0; pageIndex < PageCount; pageIndex++)
        {
            pages.Add(await GetItemsAsync(httpClient, $"pageIndex={pageIndex}&pageSize={PageSize}&sort={sort}"));
        }
        return pages;
    }

    private static int[] Ids(PaginatedItems<CatalogItem> page) => page.Data.Select(i => i.Id).ToArray();

    [Fact]
    [Trait("TestCase", "TC-BUG-40-11")]
    public async Task TC_BUG_40_11_PriceAscOrdersAll101ItemsAcrossEveryPage()
    {
        int[] expectedPage0Ids = [31, 51, 97, 85, 34, 66, 54, 14, 10];
        decimal[] expectedPage0Prices = [21.99m, 29.99m, 49.99m, 49.99m, 54.99m, 59.99m, 59.99m, 59.99m, 59.99m];
        int[] expectedPage11Ids = [42, 72];
        decimal[] expectedPage11Prices = [699.00m, 699.00m];

        var pages = await GetAllPagesAsync("price-asc");

        for (var n = 0; n < PageCount; n++)
        {
            Assert.Equal(TotalItems, pages[n].Count);
            Assert.Equal(PageSize, pages[n].PageSize);
            Assert.Equal(n < 11 ? 9 : 2, pages[n].Data.Count());
        }
        Assert.Equal(expectedPage0Ids, Ids(pages[0]));
        Assert.Equal(expectedPage0Prices, pages[0].Data.Select(i => i.Price).ToArray());
        Assert.Equal(expectedPage11Ids, Ids(pages[11]));
        Assert.Equal(expectedPage11Prices, pages[11].Data.Select(i => i.Price).ToArray());

        var all = pages.SelectMany(p => p.Data).ToList();
        Assert.Equal(TotalItems, all.Count);
        Assert.Equal(TotalItems, all.Select(i => i.Id).Distinct().Count());
        for (var k = 1; k < all.Count; k++)
        {
            Assert.True(all[k].Price >= all[k - 1].Price, $"item {k} (id {all[k].Id}, {all[k].Price}) costs less than item {k - 1} (id {all[k - 1].Id}, {all[k - 1].Price})");
        }
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-40-12")]
    public async Task TC_BUG_40_12_PriceDescOrdersAll101ItemsAcrossEveryPage()
    {
        int[] expectedPage0Ids = [42, 72, 22, 92, 32, 43, 12, 83, 62];
        int[] expectedPage11Ids = [51, 31];
        decimal[] expectedPage11Prices = [29.99m, 21.99m];

        var pages = await GetAllPagesAsync("price-desc");

        Assert.All(pages, p => Assert.Equal(TotalItems, p.Count));
        Assert.Equal(expectedPage0Ids, Ids(pages[0]));
        var page1First = pages[1].Data.First();
        Assert.Equal(53, page1First.Id);
        Assert.Equal("Raven Swift Snowboard", page1First.Name);
        Assert.Equal(349.00m, page1First.Price);
        Assert.Equal(expectedPage11Ids, Ids(pages[11]));
        Assert.Equal(expectedPage11Prices, pages[11].Data.Select(i => i.Price).ToArray());

        var all = pages.SelectMany(p => p.Data).ToList();
        Assert.Equal(TotalItems, all.Select(i => i.Id).Distinct().Count());
        for (var k = 1; k < all.Count; k++)
        {
            Assert.True(all[k].Price <= all[k - 1].Price, $"item {k} (id {all[k].Id}, {all[k].Price}) costs more than item {k - 1} (id {all[k - 1].Id}, {all[k - 1].Price})");
        }
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-40-13")]
    public async Task TC_BUG_40_13_NameDescOrdersAll101ItemsAcrossEveryPage()
    {
        int[] expectedPage0FirstSevenIds = [30, 46, 1, 55, 11, 9, 33];
        // Venture 2022 Snowboard and Venture 2.0 40L Waterproof Duffel Bag: their relative order depends on collation.
        int[] expectedPage0LastTwoIdsAsSet = [22, 67];
        int[] expectedPage11Ids = [95, 99];

        var pages = await GetAllPagesAsync("name-desc");

        Assert.All(pages, p => Assert.Equal(TotalItems, p.Count));
        var page0Ids = Ids(pages[0]);
        Assert.Equal(9, page0Ids.Length);
        Assert.Equal(expectedPage0FirstSevenIds, page0Ids.Take(7).ToArray());
        Assert.Equal(expectedPage0LastTwoIdsAsSet, page0Ids.Skip(7).Order().ToArray());
        Assert.Equal(expectedPage11Ids, Ids(pages[11]));
        Assert.Equal(TotalItems, pages.SelectMany(p => p.Data).Select(i => i.Id).Distinct().Count());
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-40-14")]
    public async Task TC_BUG_40_14_NoSortAndNameAscReturnTheDefaultOrder()
    {
        var httpClient = CreateHttpClient();

        var noSort = await GetItemsAsync(httpClient, $"pageIndex=0&pageSize={PageSize}");
        var nameAsc = await GetItemsAsync(httpClient, $"pageIndex=0&pageSize={PageSize}&sort=name-asc");

        Assert.Equal(TotalItems, noSort.Count);
        Assert.Equal(TotalItems, nameAsc.Count);
        Assert.Equal(DefaultPage0Ids, Ids(noSort));
        Assert.Equal(DefaultPage0Ids, Ids(nameAsc));
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-40-15")]
    public async Task TC_BUG_40_15_SortWithBrandAndTypeFiltersOrdersOnlyTheFilteredItems()
    {
        const int gravitatorBrandId = 2;
        const int skiBoardingTypeId = 3;
        int[] expectedBrandPage0Ids = [54, 14, 94, 30, 84, 2, 26, 69, 32];
        int[] expectedBrandPage1Ids = [42, 72];
        int[] expectedTypePage1Ids = [53, 5, 73, 60, 82, 39, 16, 3, 30];
        var httpClient = CreateHttpClient();

        var response1 = await GetItemsAsync(httpClient, $"brand={gravitatorBrandId}&pageIndex=0&pageSize={PageSize}&sort=price-asc");
        var response2 = await GetItemsAsync(httpClient, $"brand={gravitatorBrandId}&pageIndex=1&pageSize={PageSize}&sort=price-asc");
        var response3 = await GetItemsAsync(httpClient, $"brand={gravitatorBrandId}&pageIndex=0&pageSize={PageSize}");
        var response4 = await GetItemsAsync(httpClient, $"type={skiBoardingTypeId}&pageIndex=1&pageSize={PageSize}&sort=price-desc");

        Assert.Equal(11, response1.Count);
        Assert.Equal(expectedBrandPage0Ids, Ids(response1));
        Assert.Equal(11, response2.Count);
        Assert.Equal(expectedBrandPage1Ids, Ids(response2));
        Assert.Equal(11, response3.Count);
        Assert.Equal(18, response4.Count);
        Assert.Equal(expectedTypePage1Ids, Ids(response4));
        Assert.All(response1.Data.Concat(response2.Data), i => Assert.Equal(gravitatorBrandId, i.CatalogBrandId));
        Assert.All(response4.Data, i => Assert.Equal(skiBoardingTypeId, i.CatalogTypeId));
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-40-16")]
    public async Task TC_BUG_40_16_UnknownSortValueFallsBackToTheDefaultOrder()
    {
        var httpClient = CreateHttpClient();

        // GetItemsAsync asserts 200 (not 400).
        var result = await GetItemsAsync(httpClient, $"pageIndex=0&pageSize={PageSize}&sort=cheapest");

        Assert.Equal(TotalItems, result.Count);
        Assert.Equal(DefaultPage0Ids, Ids(result));
    }
}
