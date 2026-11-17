using System.Net;
using System.Text.Json;
using Asp.Versioning;
using Asp.Versioning.Http;
using eShop.Catalog.API.Model;

namespace eShop.Catalog.FunctionalTests;

// BUG-43: the catalog name search matches from the start of the name regardless of letter case,
// while starts-with semantics, paging and the type and brand filters are unchanged.
// TC-BUG-43-01 to TC-BUG-43-04 (the ticket's reproduction steps) run on the test stack (e2e/teststack/bug-43.spec.ts).
[Collection(CatalogApiCollection.Name)]
[Trait("Story", "BUG-43")]
public sealed class Bug43Tests
{
    private readonly HttpClient _httpClient;
    private readonly JsonSerializerOptions _jsonSerializerOptions = new(JsonSerializerDefaults.Web);

    public Bug43Tests(CatalogApiFixture fixture)
    {
        _httpClient = fixture.CreateDefaultClient(new ApiVersionHandler(new QueryStringApiVersionWriter(), new ApiVersion(2.0)));
    }

    private async Task<PaginatedItems<CatalogItem>> GetItemsAsync(string query)
    {
        var response = await _httpClient.GetAsync($"/api/catalog/items?{query}", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        return JsonSerializer.Deserialize<PaginatedItems<CatalogItem>>(body, _jsonSerializerOptions);
    }

    private async Task<int> GetIdByNameAsync(string path, string property, string name)
    {
        var response = await _httpClient.GetAsync(path, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        return document.RootElement.EnumerateArray().Single(e => e.GetProperty(property).GetString() == name).GetProperty("id").GetInt32();
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-43-05")]
    public async Task TC_BUG_43_05_NameBackpackReturnsNoItemsBecauseMatchIsAnchoredAtStart()
    {
        var result = await GetItemsAsync("name=Backpack");

        Assert.Equal(0, result.Count);
        Assert.Empty(result.Data);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-43-06")]
    public async Task TC_BUG_43_06_SecondPageOfSizeTwoForLowerCaseNameHoldsLastTwoExplorerItems()
    {
        var result = await GetItemsAsync("name=explorer&PageSize=2&PageIndex=1");

        Assert.Equal(1, result.PageIndex);
        Assert.Equal(2, result.PageSize);
        Assert.Equal(4, result.Count);
        Assert.Equal(new[] { "Explorer Camping Tent", "Explorer Frost Boots" }, result.Data.Select(i => i.Name).ToArray());
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-43-07")]
    public async Task TC_BUG_43_07_BrandFilterNarrowsLowerCaseNameSearchToBrExplorerItems()
    {
        var brR = await GetIdByNameAsync("/api/catalog/catalogbrands", "brand", "B&R");

        var result = await GetItemsAsync($"name=explorer&brand={brR}");

        Assert.Equal(2, result.Count);
        Assert.Equal(new[] { "Explorer Biking Computer", "Explorer Camping Tent" }, result.Data.Select(i => i.Name).ToArray());
        Assert.All(result.Data, i => Assert.Equal(brR, i.CatalogBrandId));
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-43-08")]
    public async Task TC_BUG_43_08_TypeFilterNarrowsUpperCaseNameSearchToFootwearExplorerItem()
    {
        var footwear = await GetIdByNameAsync("/api/catalog/catalogtypes", "type", "Footwear");

        var result = await GetItemsAsync($"name=EXPLORER&type={footwear}");

        Assert.Equal(1, result.Count);
        var item = Assert.Single(result.Data);
        Assert.Equal("Explorer Frost Boots", item.Name);
        Assert.Equal(footwear, item.CatalogTypeId);
    }
}
