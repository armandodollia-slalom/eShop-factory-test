using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Asp.Versioning;
using Asp.Versioning.Http;
using eShop.Catalog.API.Model;
using Microsoft.AspNetCore.Mvc.Testing;

namespace eShop.Catalog.FunctionalTests;

[Trait("Story", "BUG-17")]
public sealed class Bug17CatalogNameValidationTests : IClassFixture<CatalogApiFixture>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly JsonSerializerOptions _json = new(JsonSerializerDefaults.Web);

    public Bug17CatalogNameValidationTests(CatalogApiFixture fixture) => _factory = fixture;

    private HttpClient CreateHttpClient(double version) =>
        _factory.CreateDefaultClient(new ApiVersionHandler(new QueryStringApiVersionWriter(), new ApiVersion(version)));

    private static Dictionary<string, object> Body(params (string Key, object Value)[] extra)
    {
        var body = new Dictionary<string, object>
        {
            ["id"] = 10017,
            ["description"] = "Test item",
            ["price"] = 10.5m,
            ["catalogBrandId"] = 1,
            ["catalogTypeId"] = 1,
        };
        foreach (var (key, value) in extra)
        {
            body[key] = value;
        }
        return body;
    }

    private static async Task AssertRejectedAsync(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Null(response.Headers.Location);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>(TestContext.Current.CancellationToken);
        Assert.Equal(JsonValueKind.String, problem.GetProperty("detail").ValueKind);
        Assert.False(string.IsNullOrWhiteSpace(problem.GetProperty("detail").GetString()));
    }

    private async Task<int> CountAsync(HttpClient client)
    {
        var response = await client.GetAsync("/api/catalog/items?pageIndex=0&pageSize=1", TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();
        var page = await response.Content.ReadFromJsonAsync<PaginatedItems<CatalogItem>>(_json, TestContext.Current.CancellationToken);
        return (int)page!.Count;
    }

    private async Task PostRejectedAsync(Dictionary<string, object> body)
    {
        var client = CreateHttpClient(2.0);
        var response = await client.PostAsJsonAsync("/api/catalog/items", body, TestContext.Current.CancellationToken);
        await AssertRejectedAsync(response);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-17-01")]
    public Task TC_BUG_17_01_CreateWithoutNamePropertyReturns400() => PostRejectedAsync(Body());

    [Fact]
    [Trait("TestCase", "TC-BUG-17-02")]
    public Task TC_BUG_17_02_CreateWithNullNameReturns400() => PostRejectedAsync(Body(("name", null!)));

    [Fact]
    [Trait("TestCase", "TC-BUG-17-03")]
    public Task TC_BUG_17_03_CreateWithEmptyNameReturns400() => PostRejectedAsync(Body(("name", "")));

    [Fact]
    [Trait("TestCase", "TC-BUG-17-04")]
    public Task TC_BUG_17_04_CreateWithWhitespaceNameReturns400() => PostRejectedAsync(Body(("name", "   ")));

    [Fact]
    [Trait("TestCase", "TC-BUG-17-05")]
    public async Task TC_BUG_17_05_RejectedCreateAddsNoRow()
    {
        var client = CreateHttpClient(2.0);
        var before = await CountAsync(client);
        var response = await client.PostAsJsonAsync("/api/catalog/items", Body(), TestContext.Current.CancellationToken);
        await AssertRejectedAsync(response);
        Assert.Equal(before, await CountAsync(client));
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-17-06")]
    public async Task TC_BUG_17_06_CreateWithValidNameReturns201()
    {
        var client = CreateHttpClient(2.0);
        var response = await client.PostAsJsonAsync("/api/catalog/items", Body(("name", "BUG-17 Valid Item")), TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(response.Headers.Location);
        Assert.EndsWith("/api/catalog/items/10017", response.Headers.Location!.OriginalString);
        var fetched = await client.GetAsync(response.Headers.Location, TestContext.Current.CancellationToken);
        fetched.EnsureSuccessStatusCode();
        var item = await fetched.Content.ReadFromJsonAsync<CatalogItem>(_json, TestContext.Current.CancellationToken);
        Assert.Equal("BUG-17 Valid Item", item!.Name);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-17-07")]
    public async Task TC_BUG_17_07_UpdateV2WithBlankNameReturns400AndKeepsItem()
    {
        var client = CreateHttpClient(2.0);
        var original = await client.GetFromJsonAsync<CatalogItem>("/api/catalog/items/1", _json, TestContext.Current.CancellationToken);
        var originalName = original!.Name;
        original.Name = "";
        var response = await client.PutAsJsonAsync("/api/catalog/items/1", original, TestContext.Current.CancellationToken);
        await AssertRejectedAsync(response);
        var after = await client.GetFromJsonAsync<CatalogItem>("/api/catalog/items/1", _json, TestContext.Current.CancellationToken);
        Assert.Equal(originalName, after!.Name);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-17-08")]
    public async Task TC_BUG_17_08_UpdateV1WithoutNameReturns400AndKeepsItem()
    {
        var client = CreateHttpClient(1.0);
        var original = await client.GetFromJsonAsync<CatalogItem>("/api/catalog/items/1", _json, TestContext.Current.CancellationToken);
        var originalName = original!.Name;
        var payload = JsonSerializer.SerializeToNode(original, _json)!.AsObject();
        payload.Remove("name");
        var response = await client.PutAsJsonAsync("/api/catalog/items", payload, TestContext.Current.CancellationToken);
        await AssertRejectedAsync(response);
        var after = await client.GetFromJsonAsync<CatalogItem>("/api/catalog/items/1", _json, TestContext.Current.CancellationToken);
        Assert.Equal(originalName, after!.Name);
    }
}
