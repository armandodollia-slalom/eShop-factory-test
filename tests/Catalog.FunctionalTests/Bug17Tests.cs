using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading;
using Asp.Versioning;
using Asp.Versioning.Http;
using eShop.Catalog.API.Model;
using Microsoft.AspNetCore.Mvc.Testing;

namespace eShop.Catalog.FunctionalTests;

// BUG-17: create/update of a catalog item without a name must answer 400 (not 500).
[Trait("Story", "BUG-17")]
public sealed class Bug17Tests : IClassFixture<CatalogApiFixture>
{
    private const string RequiredMessage = "The Name field is required.";
    private const string DetailMessage = "Item name must be provided in the request body.";

    private readonly WebApplicationFactory<Program> _factory;
    private readonly JsonSerializerOptions _json = new(JsonSerializerDefaults.Web);

    public Bug17Tests(CatalogApiFixture fixture)
    {
        _factory = fixture;
    }

    private HttpClient CreateHttpClient(double version)
    {
        var handler = new ApiVersionHandler(new QueryStringApiVersionWriter(), new ApiVersion(version));
        return _factory.CreateDefaultClient(handler);
    }

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    private async Task<int> CountAsync(HttpClient client)
    {
        var response = await client.GetAsync("/api/catalog/items?pageIndex=0&pageSize=1", Ct);
        response.EnsureSuccessStatusCode();
        var result = JsonSerializer.Deserialize<PaginatedItems<CatalogItem>>(await response.Content.ReadAsStringAsync(Ct), _json);
        return (int)result!.Count;
    }

    private static async Task AssertNameProblemAsync(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(Ct));
        var root = doc.RootElement;
        var names = root.GetProperty("errors").GetProperty("Name").EnumerateArray().Select(e => e.GetString()).ToList();
        Assert.NotEmpty(names);
        Assert.Contains(RequiredMessage, names);
        Assert.Equal(DetailMessage, root.GetProperty("detail").GetString());
    }

    private async Task AssertCreateRejectedAsync(double version, Dictionary<string, object?> body)
    {
        var client = CreateHttpClient(version);
        var before = await CountAsync(client);

        var response = await client.PostAsJsonAsync("/api/catalog/items", body, Ct);

        await AssertNameProblemAsync(response);
        Assert.Equal(before, await CountAsync(client));
    }

    private static Dictionary<string, object?> Body(params (string Key, object? Value)[] extra)
    {
        var body = new Dictionary<string, object?>
        {
            ["price"] = 10.0,
            ["catalogBrandId"] = 1,
            ["catalogTypeId"] = 1,
            ["availableStock"] = 5,
        };
        foreach (var (key, value) in extra) body[key] = value;
        return body;
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-17-01")]
    public Task TC_BUG_17_01_PostWithoutNameIsRejectedV2()
        => AssertCreateRejectedAsync(2.0, Body(("description", "No name")));

    [Fact]
    [Trait("TestCase", "TC-BUG-17-02")]
    public Task TC_BUG_17_02_PostWithoutNameIsRejectedV1()
        => AssertCreateRejectedAsync(1.0, Body(("description", "No name")));

    [Fact]
    [Trait("TestCase", "TC-BUG-17-03")]
    public Task TC_BUG_17_03_PostWithNullNameIsRejected()
        => AssertCreateRejectedAsync(2.0, Body(("name", null)));

    [Fact]
    [Trait("TestCase", "TC-BUG-17-04")]
    public Task TC_BUG_17_04_PostWithEmptyNameIsRejected()
        => AssertCreateRejectedAsync(2.0, Body(("name", "")));

    [Fact]
    [Trait("TestCase", "TC-BUG-17-05")]
    public Task TC_BUG_17_05_PostWithWhitespaceNameIsRejected()
        => AssertCreateRejectedAsync(2.0, Body(("name", "   ")));

    [Fact]
    [Trait("TestCase", "TC-BUG-17-06")]
    public async Task TC_BUG_17_06_PostWithValidNameStillCreatesItem()
    {
        var client = CreateHttpClient(2.0);
        const string name = "BUG-17 Test Item";

        var created = await client.PostAsJsonAsync("/api/catalog/items", Body(("id", 90017), ("name", name), ("description", "Valid")), Ct);

        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var location = created.Headers.Location!.ToString();
        Assert.Matches(@"/api/catalog/items/\d+$", location);
        var id = int.Parse(location[(location.LastIndexOf('/') + 1)..]);

        try
        {
            var response = await client.GetAsync($"/api/catalog/items?name={Uri.EscapeDataString(name)}&pageIndex=0&pageSize=5", Ct);
            response.EnsureSuccessStatusCode();
            var result = JsonSerializer.Deserialize<PaginatedItems<CatalogItem>>(await response.Content.ReadAsStringAsync(Ct), _json);
            Assert.Single(result!.Data, i => i.Name == name);
        }
        finally
        {
            var deleted = await client.DeleteAsync($"/api/catalog/items/{id}", Ct);
            Assert.Equal(HttpStatusCode.NoContent, deleted.StatusCode);
        }
    }

    private async Task AssertUpdateRejectedAsync(double version, string putPath)
    {
        var client = CreateHttpClient(version);
        var beforeResponse = await client.GetAsync("/api/catalog/items/1", Ct);
        beforeResponse.EnsureSuccessStatusCode();
        var before = JsonSerializer.Deserialize<CatalogItem>(await beforeResponse.Content.ReadAsStringAsync(Ct), _json)!;

        var response = await client.PutAsJsonAsync(putPath, new { id = 1, price = 99.0, catalogBrandId = 1, catalogTypeId = 1, availableStock = 5 }, Ct);

        await AssertNameProblemAsync(response);
        var afterResponse = await client.GetAsync("/api/catalog/items/1", Ct);
        afterResponse.EnsureSuccessStatusCode();
        var after = JsonSerializer.Deserialize<CatalogItem>(await afterResponse.Content.ReadAsStringAsync(Ct), _json)!;
        Assert.Equal(before.Name, after.Name);
        Assert.Equal(before.Price, after.Price);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-17-07")]
    public Task TC_BUG_17_07_PutV2WithoutNameIsRejectedAndItemUnchanged()
        => AssertUpdateRejectedAsync(2.0, "/api/catalog/items/1");

    [Fact]
    [Trait("TestCase", "TC-BUG-17-08")]
    public Task TC_BUG_17_08_PutV1WithoutNameIsRejectedAndItemUnchanged()
        => AssertUpdateRejectedAsync(1.0, "/api/catalog/items");
}
