using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading;
using Asp.Versioning;
using Asp.Versioning.Http;
using eShop.Catalog.API.Model;
using Microsoft.AspNetCore.Mvc.Testing;

namespace eShop.Catalog.FunctionalTests;

// BUG-18: creating a catalog item with an existing id must answer 409 (not 500).
// TC-BUG-18-04/05 (generated ids) run on the test stack in e2e/teststack/bug-18.spec.ts.
[Trait("Story", "BUG-18")]
public sealed class Bug18Tests : IClassFixture<CatalogApiFixture>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly JsonSerializerOptions _json = new(JsonSerializerDefaults.Web);

    public Bug18Tests(CatalogApiFixture fixture)
    {
        _factory = fixture;
    }

    private HttpClient CreateHttpClient(double version)
    {
        var handler = new ApiVersionHandler(new QueryStringApiVersionWriter(), new ApiVersion(version));
        return _factory.CreateDefaultClient(handler);
    }

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    private static Dictionary<string, object?> Body(string name, params (string Key, object? Value)[] extra)
    {
        var body = new Dictionary<string, object?>
        {
            ["name"] = name,
            ["catalogBrandId"] = 1,
            ["catalogTypeId"] = 1,
            ["price"] = 10,
            ["availableStock"] = 1,
        };
        foreach (var (key, value) in extra) body[key] = value;
        return body;
    }

    private async Task<long> CountAsync(HttpClient client)
    {
        var response = await client.GetAsync("/api/catalog/items?pageIndex=0&pageSize=1", Ct);
        response.EnsureSuccessStatusCode();
        var result = JsonSerializer.Deserialize<PaginatedItems<CatalogItem>>(await response.Content.ReadAsStringAsync(Ct), _json);
        return result!.Count;
    }

    private async Task<CatalogItem> GetItemAsync(HttpClient client, string location)
    {
        var response = await client.GetAsync(location, Ct);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return JsonSerializer.Deserialize<CatalogItem>(await response.Content.ReadAsStringAsync(Ct), _json)!;
    }

    private static async Task AssertConflictAsync(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(Ct));
        Assert.Equal(JsonValueKind.Object, doc.RootElement.ValueKind);
        Assert.Equal(409, doc.RootElement.GetProperty("status").GetInt32());
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-18-01")]
    public async Task TC_BUG_18_01_ExistingIdV2ReturnsConflict()
    {
        var client = CreateHttpClient(2.0);
        var response = await client.PostAsJsonAsync("/api/catalog/items", Body("Duplicate", ("id", 1)), Ct);
        await AssertConflictAsync(response);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-18-02")]
    public async Task TC_BUG_18_02_ExistingIdV1ReturnsConflict()
    {
        var client = CreateHttpClient(1.0);
        var response = await client.PostAsJsonAsync("/api/catalog/items", Body("Duplicate", ("id", 1)), Ct);
        await AssertConflictAsync(response);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-18-03")]
    public async Task TC_BUG_18_03_ConflictLeavesCatalogUnchanged()
    {
        var client = CreateHttpClient(2.0);
        var before = await GetItemAsync(client, "/api/catalog/items/1");
        var countBefore = await CountAsync(client);

        var response = await client.PostAsJsonAsync("/api/catalog/items", Body("Overwrite attempt", ("id", 1), ("price", 999)), Ct);
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);

        var after = await GetItemAsync(client, "/api/catalog/items/1");
        Assert.Equal(before.Name, after.Name);
        Assert.NotEqual("Overwrite attempt", after.Name);
        Assert.Equal(before.Price, after.Price);
        Assert.NotEqual(999m, after.Price);
        Assert.Equal(countBefore, await CountAsync(client));
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-18-06")]
    public async Task TC_BUG_18_06_UnusedExplicitIdCreated()
    {
        var client = CreateHttpClient(2.0);
        var response = await client.PostAsJsonAsync("/api/catalog/items", Body("Explicit Id Item", ("id", 5000)), Ct);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.EndsWith("/api/catalog/items/5000", response.Headers.Location!.OriginalString);

        var item = await GetItemAsync(client, "/api/catalog/items/5000");
        Assert.Equal("Explicit Id Item", item.Name);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-18-07")]
    public async Task TC_BUG_18_07_RepeatCreateSameIdConflict()
    {
        var client = CreateHttpClient(2.0);
        var first = await client.PostAsJsonAsync("/api/catalog/items", Body("First", ("id", 5001)), Ct);
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);

        var second = await client.PostAsJsonAsync("/api/catalog/items", Body("Second", ("id", 5001)), Ct);
        await AssertConflictAsync(second);

        var item = await GetItemAsync(client, "/api/catalog/items/5001");
        Assert.Equal("First", item.Name);
    }

    // Concurrent creates of the same new id may all pass the existence check; the losers must still get 409, never 500.
    [Fact]
    public async Task ConcurrentCreatesSameIdReturnOneCreatedAndConflicts()
    {
        var client = CreateHttpClient(2.0);
        var responses = await Task.WhenAll(Enumerable.Range(0, 8).Select(i =>
            client.PostAsJsonAsync("/api/catalog/items", Body($"Concurrent {i}", ("id", 5002)), Ct)));

        Assert.Single(responses, r => r.StatusCode == HttpStatusCode.Created);
        foreach (var response in responses.Where(r => r.StatusCode != HttpStatusCode.Created))
        {
            await AssertConflictAsync(response);
        }
    }
}
