using System.Net;
using System.Text.Json;

namespace eShop.Catalog.FunctionalTests;

// BUG-36: listing catalog items with a negative page index or page size answers 400 with a validation problem
// naming the parameter, instead of 500; valid paging keeps returning the requested page.
// Every case lists GET /api/catalog/items anonymously against the fixture's seeded catalog (101 items).
[Trait("Story", "BUG-36")]
[Collection(CatalogApiCollection.Name)]
public sealed class Bug36Tests(CatalogApiFixture fixture)
{
    private const string ProblemJson = "application/problem+json";
    private const string Json = "application/json";
    private const string PageIndex = "PageIndex";
    private const string PageSize = "PageSize";
    private const int CatalogCount = 101;

    private async Task<(HttpResponseMessage Response, JsonElement Body)> GetAsync(string pathAndQuery)
    {
        using var client = fixture.CreateDefaultClient();
        var response = await client.GetAsync(pathAndQuery, TestContext.Current.CancellationToken);
        var content = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        using var document = JsonDocument.Parse(content);
        return (response, document.RootElement.Clone());
    }

    private async Task AssertValidationProblem(string pathAndQuery, string[] named, string[] notNamed)
    {
        var (response, body) = await GetAsync(pathAndQuery);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(ProblemJson, response.Content.Headers.ContentType?.MediaType);
        Assert.Equal(400, body.GetProperty("status").GetInt32());

        var errors = body.GetProperty("errors");
        foreach (var key in named)
        {
            Assert.True(errors.TryGetProperty(key, out var messages), $"errors does not name {key}: {errors}");
            Assert.Equal(JsonValueKind.Array, messages.ValueKind);
            Assert.NotEqual(0, messages.GetArrayLength());
        }
        foreach (var key in notNamed)
        {
            Assert.False(errors.TryGetProperty(key, out _), $"errors names {key}: {errors}");
        }
    }

    private async Task AssertPage(string pathAndQuery, int pageIndex, int pageSize, int items)
    {
        var (response, body) = await GetAsync(pathAndQuery);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(Json, response.Content.Headers.ContentType?.MediaType);
        Assert.Equal(pageIndex, body.GetProperty("pageIndex").GetInt32());
        Assert.Equal(pageSize, body.GetProperty("pageSize").GetInt32());
        Assert.Equal(CatalogCount, body.GetProperty("count").GetInt64());
        var data = body.GetProperty("data");
        Assert.Equal(JsonValueKind.Array, data.ValueKind);
        Assert.Equal(items, data.GetArrayLength());
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-36-01")]
    public Task TC_BUG_36_01_V1ListWithNegativePageIndexReturns400NamingPageIndex() =>
        AssertValidationProblem("/api/catalog/items?api-version=1.0&pageIndex=-1", named: [PageIndex], notNamed: [PageSize]);

    [Fact]
    [Trait("TestCase", "TC-BUG-36-02")]
    public Task TC_BUG_36_02_V1ListWithNegativePageSizeReturns400NamingPageSize() =>
        AssertValidationProblem("/api/catalog/items?api-version=1.0&pageSize=-1", named: [PageSize], notNamed: [PageIndex]);

    [Fact]
    [Trait("TestCase", "TC-BUG-36-03")]
    public Task TC_BUG_36_03_V2ListWithNegativePageIndexReturns400NamingPageIndex() =>
        AssertValidationProblem("/api/catalog/items?api-version=2.0&pageIndex=-1", named: [PageIndex], notNamed: [PageSize]);

    [Fact]
    [Trait("TestCase", "TC-BUG-36-04")]
    public Task TC_BUG_36_04_V2ListWithNegativePageSizeReturns400NamingPageSize() =>
        AssertValidationProblem("/api/catalog/items?api-version=2.0&pageSize=-1", named: [PageSize], notNamed: [PageIndex]);

    [Fact]
    [Trait("TestCase", "TC-BUG-36-05")]
    public Task TC_BUG_36_05_V1ListWithNegativePageIndexAndPageSizeNamesBoth() =>
        AssertValidationProblem("/api/catalog/items?api-version=1.0&pageIndex=-1&pageSize=-1", named: [PageIndex, PageSize], notNamed: []);

    [Fact]
    [Trait("TestCase", "TC-BUG-36-06")]
    public Task TC_BUG_36_06_V1ListWithPageIndex0AndPageSize1ReturnsFirstPage() =>
        AssertPage("/api/catalog/items?api-version=1.0&pageIndex=0&pageSize=1", pageIndex: 0, pageSize: 1, items: 1);

    [Fact]
    [Trait("TestCase", "TC-BUG-36-07")]
    public Task TC_BUG_36_07_V2ListWithPageIndex0AndPageSize1ReturnsFirstPage() =>
        AssertPage("/api/catalog/items?api-version=2.0&pageIndex=0&pageSize=1", pageIndex: 0, pageSize: 1, items: 1);

    [Fact]
    [Trait("TestCase", "TC-BUG-36-08")]
    public Task TC_BUG_36_08_V1ListWithPageIndex10AndPageSize10ReturnsLastPartialPage() =>
        AssertPage("/api/catalog/items?api-version=1.0&pageIndex=10&pageSize=10", pageIndex: 10, pageSize: 10, items: 1);

    // The same pagination validation guards every other paginated catalog route.
    [Theory]
    [InlineData("/api/catalog/items/by/Wanderer?api-version=1.0")]
    [InlineData("/api/catalog/items/withsemanticrelevance/Wanderer?api-version=1.0")]
    [InlineData("/api/catalog/items/withsemanticrelevance?api-version=2.0&text=Wanderer")]
    [InlineData("/api/catalog/items/type/3/brand/3?api-version=1.0")]
    [InlineData("/api/catalog/items/type/all/brand/3?api-version=1.0")]
    public Task OtherPaginatedRoutesWithNegativePageIndexAndPageSizeReturn400NamingBoth(string pathAndQuery) =>
        AssertValidationProblem($"{pathAndQuery}&pageIndex=-1&pageSize=-1", named: [PageIndex, PageSize], notNamed: []);
}
