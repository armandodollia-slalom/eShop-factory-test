using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Asp.Versioning;
using Asp.Versioning.Http;
using eShop.Catalog.API.Model;
using Microsoft.AspNetCore.Mvc.Testing;

namespace eShop.Catalog.FunctionalTests;

[Trait("Story", "BUG-18")]
public sealed class Bug18CatalogDuplicateIdTests : IClassFixture<CatalogApiFixture>
{
    private readonly CatalogApiFixture _fixture;
    private readonly WebApplicationFactory<Program> _factory;
    private readonly JsonSerializerOptions _json = new(JsonSerializerDefaults.Web);

    public Bug18CatalogDuplicateIdTests(CatalogApiFixture fixture) => _factory = _fixture = fixture;

    private HttpClient CreateHttpClient(double version) =>
        _factory.CreateDefaultClient(new ApiVersionHandler(new QueryStringApiVersionWriter(), new ApiVersion(version)));

    private static Dictionary<string, object> Body(string name, int? id = null, decimal price = 10.5m, int brand = 1, int type = 1)
    {
        var body = new Dictionary<string, object>
        {
            ["name"] = name,
            ["price"] = price,
            ["catalogBrandId"] = brand,
            ["catalogTypeId"] = type,
        };
        if (id is not null)
        {
            body["id"] = id.Value;
        }
        return body;
    }

    private static async Task AssertConflictAsync(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Null(response.Headers.Location);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>(TestContext.Current.CancellationToken);
        Assert.Equal(JsonValueKind.String, problem.GetProperty("detail").ValueKind);
        Assert.False(string.IsNullOrWhiteSpace(problem.GetProperty("detail").GetString()));
    }

    private async Task<CatalogItem> GetItemAsync(HttpClient client, int id)
    {
        var response = await client.GetAsync($"/api/catalog/items/{id}", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<CatalogItem>(_json, TestContext.Current.CancellationToken))!;
    }

    private async Task<int> CountAsync(HttpClient client)
    {
        var response = await client.GetAsync("/api/catalog/items?pageIndex=0&pageSize=1", TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();
        var page = await response.Content.ReadFromJsonAsync<PaginatedItems<CatalogItem>>(_json, TestContext.Current.CancellationToken);
        return (int)page!.Count;
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-18-01")]
    public async Task TC_BUG_18_01_CreateWithExistingIdReturns409()
    {
        var client = CreateHttpClient(2.0);
        var response = await client.PostAsJsonAsync("/api/catalog/items", Body("Duplicate item", id: 1), TestContext.Current.CancellationToken);
        await AssertConflictAsync(response);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-18-02")]
    public async Task TC_BUG_18_02_RejectedDuplicateCreateLeavesDataUntouched()
    {
        var client = CreateHttpClient(2.0);
        var original = await GetItemAsync(client, 1);
        var before = await CountAsync(client);

        var response = await client.PostAsJsonAsync("/api/catalog/items", Body("Duplicate item", id: 1, price: 999m, brand: 2, type: 2), TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);

        var after = await GetItemAsync(client, 1);
        Assert.Equal(original.Name, after.Name);
        Assert.Equal(original.Price, after.Price);
        Assert.Equal(original.CatalogBrandId, after.CatalogBrandId);
        Assert.NotEqual("Duplicate item", after.Name);
        Assert.Equal(before, await CountAsync(client));
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-18-03")]
    public async Task TC_BUG_18_03_CreateWithExistingIdReturns409UnderV1()
    {
        var client = CreateHttpClient(1.0);
        var response = await client.PostAsJsonAsync("/api/catalog/items", Body("Duplicate item", id: 1), TestContext.Current.CancellationToken);
        await AssertConflictAsync(response);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-18-04")]
    public async Task TC_BUG_18_04_CreateWithUnusedExplicitIdReturns201()
    {
        var client = CreateHttpClient(2.0);
        var response = await client.PostAsJsonAsync("/api/catalog/items", Body("Explicit id item", id: 5000), TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.EndsWith("/api/catalog/items/5000", response.Headers.Location!.ToString());
        var item = await GetItemAsync(client, 5000);
        Assert.Equal("Explicit id item", item.Name);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-18-05")]
    public async Task TC_BUG_18_05_CreateWithoutIdGeneratesId()
    {
        // The seed inserts ids 1-101 explicitly, leaving the identity sequence at its start; move it past the seed
        // so a database-generated id is a fresh one (the stack scenario already has it there).
        await using (var connection = new Npgsql.NpgsqlConnection(await _fixture.Postgres.Resource.GetConnectionStringAsync(TestContext.Current.CancellationToken)))
        {
            await connection.OpenAsync(TestContext.Current.CancellationToken);
            await using var command = new Npgsql.NpgsqlCommand("SELECT setval(pg_get_serial_sequence('\"Catalog\"', 'Id'), GREATEST((SELECT MAX(\"Id\") FROM \"Catalog\"), 101))", connection);
            await command.ExecuteScalarAsync(TestContext.Current.CancellationToken);
        }

        var client = CreateHttpClient(2.0);
        var response = await client.PostAsJsonAsync("/api/catalog/items", Body("Generated id item"), TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var location = response.Headers.Location!.ToString();
        var id = int.Parse(location[(location.LastIndexOf('/') + 1)..]);
        Assert.True(id > 101);
        var item = await GetItemAsync(client, id);
        Assert.Equal("Generated id item", item.Name);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-18-06")]
    public async Task TC_BUG_18_06_SameNewExplicitIdTwiceReturns201Then409()
    {
        var client = CreateHttpClient(2.0);
        var first = await client.PostAsJsonAsync("/api/catalog/items", Body("First", id: 5001), TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        var second = await client.PostAsJsonAsync("/api/catalog/items", Body("Second", id: 5001), TestContext.Current.CancellationToken);
        await AssertConflictAsync(second);
        var item = await GetItemAsync(client, 5001);
        Assert.Equal("First", item.Name);
    }

    [Fact]
    public async Task GeneratedIdCollisionOnSaveReturns409()
    {
        // Point the identity sequence at an existing row so the pre-check passes (no explicit id) and the
        // primary key violation is raised by SaveChanges; restore the sequence past the existing rows afterwards.
        var connectionString = await _fixture.Postgres.Resource.GetConnectionStringAsync(TestContext.Current.CancellationToken);
        await SetIdentitySequenceAsync(connectionString, "SELECT setval(pg_get_serial_sequence('\"Catalog\"', 'Id'), 1, false)");
        try
        {
            var client = CreateHttpClient(2.0);
            var before = await CountAsync(client);

            var response = await client.PostAsJsonAsync("/api/catalog/items", Body("Generated id collision"), TestContext.Current.CancellationToken);

            await AssertConflictAsync(response);
            Assert.Equal(before, await CountAsync(client));
            Assert.NotEqual("Generated id collision", (await GetItemAsync(client, 1)).Name);
        }
        finally
        {
            await SetIdentitySequenceAsync(connectionString, "SELECT setval(pg_get_serial_sequence('\"Catalog\"', 'Id'), GREATEST((SELECT MAX(\"Id\") FROM \"Catalog\"), 101))");
        }
    }

    private static async Task SetIdentitySequenceAsync(string? connectionString, string sql)
    {
        await using var connection = new Npgsql.NpgsqlConnection(connectionString);
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var command = new Npgsql.NpgsqlCommand(sql, connection);
        await command.ExecuteScalarAsync(TestContext.Current.CancellationToken);
    }
}
