using System.Net;
using System.Text.Json;
using Asp.Versioning;
using Asp.Versioning.Http;

namespace eShop.Catalog.FunctionalTests;

// TYPE-1: GET /api/catalog/items/{id} includes the item's type; the other item endpoints are unchanged.
// The product page cases (TC-TYPE-1-05 to 07) run on the test stack (e2e/teststack/type-1.spec.ts).
[Trait("Story", "TYPE-1")]
public sealed class ProductCategoryTests : IClassFixture<CatalogApiFixture>
{
    private readonly CatalogApiFixture _fixture;

    public ProductCategoryTests(CatalogApiFixture fixture)
    {
        _fixture = fixture;
    }

    private HttpClient CreateHttpClient(double version) =>
        _fixture.CreateDefaultClient(new ApiVersionHandler(new QueryStringApiVersionWriter(), new ApiVersion(version)));

    private static async Task<JsonElement> GetJsonAsync(HttpClient client, string path)
    {
        var response = await client.GetAsync(path, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        return JsonDocument.Parse(body).RootElement.Clone();
    }

    private static void AssertTypeIsNull(JsonElement item) =>
        Assert.Equal(JsonValueKind.Null, item.GetProperty("catalogType").ValueKind);

    [Theory]
    [InlineData(1.0)]
    [InlineData(2.0)]
    [Trait("TestCase", "TC-TYPE-1-01")]
    public async Task TC_TYPE_1_01_SingleItemResponseOfItem1IncludesTypeFootwearNextToBrand(double version)
    {
        using var client = CreateHttpClient(version);

        var item = await GetJsonAsync(client, "/api/catalog/items/1");

        Assert.Equal(1, item.GetProperty("id").GetInt32());
        Assert.Equal("Wanderer Black Hiking Boots", item.GetProperty("name").GetString());

        Assert.Equal(1, item.GetProperty("catalogTypeId").GetInt32());
        var type = item.GetProperty("catalogType");
        Assert.Equal(JsonValueKind.Object, type.ValueKind);
        Assert.Equal(1, type.GetProperty("id").GetInt32());
        Assert.Equal("Footwear", type.GetProperty("type").GetString());

        Assert.Equal(1, item.GetProperty("catalogBrandId").GetInt32());
        var brand = item.GetProperty("catalogBrand");
        Assert.Equal(JsonValueKind.Object, brand.ValueKind);
        Assert.Equal(1, brand.GetProperty("id").GetInt32());
        Assert.Equal("Daybird", brand.GetProperty("brand").GetString());
    }

    [Fact]
    [Trait("TestCase", "TC-TYPE-1-02")]
    public async Task TC_TYPE_1_02_SingleItemResponseOfItem99CarriesSameTypeAsCatalogTypesList()
    {
        using var client = CreateHttpClient(1.0);

        var item = await GetJsonAsync(client, "/api/catalog/items/99");
        Assert.Equal(7, item.GetProperty("catalogTypeId").GetInt32());
        var itemType = item.GetProperty("catalogType");
        Assert.Equal(7, itemType.GetProperty("id").GetInt32());
        Assert.Equal("Navigation", itemType.GetProperty("type").GetString());

        var types = await GetJsonAsync(client, "/api/catalog/catalogtypes");
        var sevens = types.EnumerateArray().Where(t => t.GetProperty("id").GetInt32() == 7).ToList();
        var seven = Assert.Single(sevens);
        Assert.Equal(itemType.GetProperty("type").GetString(), seven.GetProperty("type").GetString());
        Assert.Equal("Navigation", seven.GetProperty("type").GetString());
    }

    [Fact]
    [Trait("TestCase", "TC-TYPE-1-03")]
    public async Task TC_TYPE_1_03_PagedItemListStillReturnsItemsWithoutTheirType()
    {
        using var client = CreateHttpClient(2.0);

        var page = await GetJsonAsync(client, "/api/catalog/items?PageSize=5&PageIndex=0");

        Assert.Equal(0, page.GetProperty("pageIndex").GetInt32());
        Assert.Equal(5, page.GetProperty("pageSize").GetInt32());
        Assert.Equal(101, page.GetProperty("count").GetInt64());
        var data = page.GetProperty("data").EnumerateArray().ToList();
        Assert.Equal(5, data.Count);
        foreach (var item in data)
        {
            Assert.Equal(JsonValueKind.Object, item.GetProperty("catalogBrand").ValueKind);
            AssertTypeIsNull(item);
            Assert.True(item.GetProperty("catalogTypeId").GetInt32() > 0, $"item {item.GetProperty("id")} has no catalogTypeId");
        }
    }

    [Fact]
    [Trait("TestCase", "TC-TYPE-1-04")]
    public async Task TC_TYPE_1_04_ItemsByIdsAndBrandMatesStillReturnItemsWithoutTheirType()
    {
        using var client = CreateHttpClient(1.0);

        var byIds = (await GetJsonAsync(client, "/api/catalog/items/by?ids=1&ids=2&ids=3")).EnumerateArray().ToList();
        Assert.Equal([1, 2, 3], byIds.Select(i => i.GetProperty("id").GetInt32()).Order());
        foreach (var item in byIds)
        {
            AssertTypeIsNull(item);
        }

        var mates = (await GetJsonAsync(client, "/api/catalog/items/1/brand-mates")).EnumerateArray().ToList();
        Assert.Equal(4, mates.Count);
        Assert.DoesNotContain(mates, i => i.GetProperty("id").GetInt32() == 1);
        foreach (var item in mates)
        {
            Assert.Equal(1, item.GetProperty("catalogBrandId").GetInt32());
            Assert.Equal(JsonValueKind.Object, item.GetProperty("catalogBrand").ValueKind);
            AssertTypeIsNull(item);
        }
    }
}
