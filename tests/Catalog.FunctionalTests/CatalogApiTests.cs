using System.Net.Http.Json;
using System.IO;
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

public sealed class CatalogApiTests : IClassFixture<CatalogApiFixture>
{
    private readonly WebApplicationFactory<Program> _webApplicationFactory;
    private readonly JsonSerializerOptions _jsonSerializerOptions = new(JsonSerializerDefaults.Web);

    public CatalogApiTests(CatalogApiFixture fixture)
    {
        _webApplicationFactory = fixture;
    }

    private HttpClient CreateHttpClient(ApiVersion apiVersion)
    {
        var handler = new ApiVersionHandler(new QueryStringApiVersionWriter(), apiVersion);
        return _webApplicationFactory.CreateDefaultClient(handler);
    }

    [Theory]
    [InlineData(1.0)]
    [InlineData(2.0)]
    public async Task GetCatalogItemsRespectsPageSize(double version)
    {
        var _httpClient = CreateHttpClient(new ApiVersion(version));

        // Act
        var response = await _httpClient.GetAsync("/api/catalog/items?pageIndex=0&pageSize=5", TestContext.Current.CancellationToken);

        // Assert
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        var result = JsonSerializer.Deserialize<PaginatedItems<CatalogItem>>(body, _jsonSerializerOptions);

        Assert.Equal(5, result.Data.Count());
        Assert.Equal(0, result.PageIndex);
        Assert.Equal(5, result.PageSize);
    }

    [Theory]
    [InlineData(1.0)]
    [InlineData(2.0)]
    public async Task UpdateCatalogItemWorksWithoutPriceUpdate(double version)
    {
        var _httpClient = CreateHttpClient(new ApiVersion(version));

        // Act - 1
        var response = await _httpClient.GetAsync("/api/catalog/items/1", TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        var itemToUpdate = JsonSerializer.Deserialize<CatalogItem>(body, _jsonSerializerOptions);

        // Act - 2
        var priorAvailableStock = itemToUpdate.AvailableStock;
        itemToUpdate.AvailableStock -= 1;
        response = version switch
        {
            1.0 => await _httpClient.PutAsJsonAsync("/api/catalog/items", itemToUpdate, TestContext.Current.CancellationToken),
            2.0 => await _httpClient.PutAsJsonAsync($"/api/catalog/items/{itemToUpdate.Id}", itemToUpdate, TestContext.Current.CancellationToken),
            _ => throw new ArgumentOutOfRangeException(nameof(version), version, null)
        };
        response.EnsureSuccessStatusCode();

        // Act - 3
        response = await _httpClient.GetAsync("/api/catalog/items/1", TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();
        body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        var updatedItem = JsonSerializer.Deserialize<CatalogItem>(body, _jsonSerializerOptions);

        // Assert - 1
        Assert.Equal(itemToUpdate.Id, updatedItem.Id);
        Assert.NotEqual(priorAvailableStock, updatedItem.AvailableStock);
    }

    [Theory]
    [InlineData(1.0)]
    [InlineData(2.0)]
    public async Task UpdateCatalogItemWorksWithPriceUpdate(double version)
    {
        var _httpClient = CreateHttpClient(new ApiVersion(version));

        // Act - 1
        var response = await _httpClient.GetAsync("/api/catalog/items/1", TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        var itemToUpdate = JsonSerializer.Deserialize<CatalogItem>(body, _jsonSerializerOptions);

        // Act - 2
        var priorAvailableStock = itemToUpdate.AvailableStock;
        itemToUpdate.AvailableStock -= 1;
        itemToUpdate.Price = 1.99m;
        response = version switch
        {
            1.0 => await _httpClient.PutAsJsonAsync("/api/catalog/items", itemToUpdate, TestContext.Current.CancellationToken),
            2.0 => await _httpClient.PutAsJsonAsync($"/api/catalog/items/{itemToUpdate.Id}", itemToUpdate, TestContext.Current.CancellationToken),
            _ => throw new ArgumentOutOfRangeException(nameof(version), version, null)
        };
        response.EnsureSuccessStatusCode();

        // Act - 3
        response = await _httpClient.GetAsync("/api/catalog/items/1", TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();
        body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        var updatedItem = JsonSerializer.Deserialize<CatalogItem>(body, _jsonSerializerOptions);

        // Assert - 1
        Assert.Equal(itemToUpdate.Id, updatedItem.Id);
        Assert.Equal(1.99m, updatedItem.Price);
        Assert.NotEqual(priorAvailableStock, updatedItem.AvailableStock);
    }

    [Theory]
    [InlineData(1.0)]
    [InlineData(2.0)]
    public async Task GetCatalogItemsbyIds(double version)
    {
        var _httpClient = CreateHttpClient(new ApiVersion(version));

        // Act
        var response = await _httpClient.GetAsync("/api/catalog/items/by?ids=1&ids=2&ids=3", TestContext.Current.CancellationToken);

        // Arrange
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        var result = JsonSerializer.Deserialize<List<CatalogItem>>(body, _jsonSerializerOptions);

        // Assert 3 items
        Assert.Equal(3, result.Count);
    }

    [Theory]
    [InlineData(1.0)]
    [InlineData(2.0)]
    public async Task GetCatalogItemWithId(double version)
    {
        var _httpClient = CreateHttpClient(new ApiVersion(version));

        // Act
        var response = await _httpClient.GetAsync("/api/catalog/items/2", TestContext.Current.CancellationToken);

        // Arrange
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        var result = JsonSerializer.Deserialize<CatalogItem>(body, _jsonSerializerOptions);

        // Assert
        Assert.Equal(2, result.Id);
        Assert.NotNull(result);
    }

    [Theory]
    [InlineData(1.0)]
    [InlineData(2.0)]
    public async Task GetCatalogItemWithExactName(double version)
    {
        var _httpClient = CreateHttpClient(new ApiVersion(version));

        // Act
        var response = version switch
        {
            1.0 => await _httpClient.GetAsync("api/catalog/items/by/Wanderer%20Black%20Hiking%20Boots?PageSize=5&PageIndex=0", TestContext.Current.CancellationToken),
            2.0 => await _httpClient.GetAsync("api/catalog/items?name=Wanderer%20Black%20Hiking%20Boots&PageSize=5&PageIndex=0", TestContext.Current.CancellationToken),
            _ => throw new ArgumentOutOfRangeException(nameof(version), version, null)
        };

        // Arrange
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        var result = JsonSerializer.Deserialize<PaginatedItems<CatalogItem>>(body, _jsonSerializerOptions);

        // Assert
        Assert.NotNull(result.Data);
        Assert.Equal(1, result.Count);
        Assert.Equal(0, result.PageIndex);
        Assert.Equal(5, result.PageSize);
        Assert.Equal("Wanderer Black Hiking Boots", result.Data.ToList().FirstOrDefault().Name);
    }

    [Theory]
    [InlineData(1.0)]
    [InlineData(2.0)]
    public async Task GetCatalogItemWithPartialName(double version)
    {
        var _httpClient = CreateHttpClient(new ApiVersion(version));

        // Act
        var response = version switch
        {
            1.0 => await _httpClient.GetAsync("api/catalog/items/by/Alpine?PageSize=5&PageIndex=0", TestContext.Current.CancellationToken),
            2.0 => await _httpClient.GetAsync("api/catalog/items?name=Alpine&PageSize=5&PageIndex=0", TestContext.Current.CancellationToken),
            _ => throw new ArgumentOutOfRangeException(nameof(version), version, null)
        };

        // Arrange
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        var result = JsonSerializer.Deserialize<PaginatedItems<CatalogItem>>(body, _jsonSerializerOptions);

        // Assert
        Assert.NotNull(result.Data);
        Assert.Equal(4, result.Count);
        Assert.Equal(0, result.PageIndex);
        Assert.Equal(5, result.PageSize);
        Assert.Contains("Alpine", result.Data.ToList().FirstOrDefault().Name);
    }

    [Theory]
    [InlineData(1.0)]
    [InlineData(2.0)]
    public async Task GetCatalogItemPicWithId(double version)
    {
        var _httpClient = CreateHttpClient(new ApiVersion(version));

        // Act
        var response = await _httpClient.GetAsync("api/catalog/items/1/pic", TestContext.Current.CancellationToken);

        // Arrange
        response.EnsureSuccessStatusCode();
        var result = response.Content.Headers.ContentType.MediaType;

        // Assert
        Assert.Equal("image/webp", result);
    }

    [Theory]
    [InlineData(1.0, 99901)]
    [InlineData(2.0, 99902)]
    public async Task GetCatalogItemPicDoesNotServeFilesOutsidePics(double version, int id)
    {
        using var httpClient = CreateHttpClient(new ApiVersion(version));
        var cancellationToken = TestContext.Current.CancellationToken;
        var environment = _webApplicationFactory.Services.GetRequiredService<IWebHostEnvironment>();
        var configurationPath = Path.Combine(environment.ContentRootPath, "appsettings.json");
        Assert.True(File.Exists(configurationPath), $"Missing test target: {configurationPath}");

        var item = new CatalogItem("Path traversal test")
        {
            Id = id,
            PictureFileName = "../appsettings.json",
            CatalogTypeId = 1,
            CatalogBrandId = 1
        };

        var createResponse = await httpClient.PostAsJsonAsync(
            "/api/catalog/items", item, cancellationToken);
        createResponse.EnsureSuccessStatusCode();

        try
        {
            var response = await httpClient.GetAsync(
                $"/api/catalog/items/{id}/pic", cancellationToken);

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }
        finally
        {
            await httpClient.DeleteAsync($"/api/catalog/items/{id}", cancellationToken);
        }
    }

    [Theory]
    [InlineData(1.0)]
    [InlineData(2.0)]
    public async Task GetCatalogItemWithsemanticrelevance(double version)
    {
        var _httpClient = CreateHttpClient(new ApiVersion(version));

        // Act
        var response = version switch
        {
            1.0 => await _httpClient.GetAsync("api/catalog/items/withsemanticrelevance/Wanderer?PageSize=5&PageIndex=0", TestContext.Current.CancellationToken),
            2.0 => await _httpClient.GetAsync("api/catalog/items/withsemanticrelevance?text=Wanderer&PageSize=5&PageIndex=0", TestContext.Current.CancellationToken),
            _ => throw new ArgumentOutOfRangeException(nameof(version), version, null)
        };

        // Arrange
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        var result = JsonSerializer.Deserialize<PaginatedItems<CatalogItem>>(body, _jsonSerializerOptions);

        // Assert
        Assert.Equal(1, result.Count);
        Assert.NotNull(result.Data);
        Assert.Equal(0, result.PageIndex);
        Assert.Equal(5, result.PageSize);
    }

    [Theory]
    [InlineData(1.0)]
    [InlineData(2.0)]
    public async Task GetCatalogItemWithTypeIdBrandId(double version)
    {
        var _httpClient = CreateHttpClient(new ApiVersion(version));

        // Act
        var response = version switch
        {
            1.0 => await _httpClient.GetAsync("api/catalog/items/type/3/brand/3?PageSize=5&PageIndex=0", TestContext.Current.CancellationToken),
            2.0 => await _httpClient.GetAsync("api/catalog/items?type=3&brand=3&PageSize=5&PageIndex=0", TestContext.Current.CancellationToken),
            _ => throw new ArgumentOutOfRangeException(nameof(version), version, null)
        };

        // Arrange
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        var result = JsonSerializer.Deserialize<PaginatedItems<CatalogItem>>(body, _jsonSerializerOptions);

        // Assert
        Assert.NotNull(result.Data);
        Assert.Equal(4, result.Count);
        Assert.Equal(0, result.PageIndex);
        Assert.Equal(5, result.PageSize);
        Assert.Equal(3, result.Data.ToList().FirstOrDefault().CatalogTypeId);
        Assert.Equal(3, result.Data.ToList().FirstOrDefault().CatalogBrandId);
    }

    [Theory]
    [InlineData(1.0)]
    [InlineData(2.0)]
    public async Task GetAllCatalogTypeItemWithBrandId(double version)
    {
        var _httpClient = CreateHttpClient(new ApiVersion(version));

        // Act
        var response = version switch
        {
            1.0 => await _httpClient.GetAsync("api/catalog/items/type/all/brand/3?PageSize=5&PageIndex=0", TestContext.Current.CancellationToken),
            2.0 => await _httpClient.GetAsync("api/catalog/items?brand=3&PageSize=5&PageIndex=0", TestContext.Current.CancellationToken),
            _ => throw new ArgumentOutOfRangeException(nameof(version), version, null)
        };

        // Arrange
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        var result = JsonSerializer.Deserialize<PaginatedItems<CatalogItem>>(body, _jsonSerializerOptions);

        // Assert
        Assert.NotNull(result.Data);
        Assert.Equal(11, result.Count);
        Assert.Equal(0, result.PageIndex);
        Assert.Equal(5, result.PageSize);
        Assert.Equal(3, result.Data.ToList().FirstOrDefault().CatalogBrandId);
    }

    [Theory]
    [InlineData(1.0)]
    [InlineData(2.0)]
    public async Task GetAllCatalogTypes(double version)
    {
        var _httpClient = CreateHttpClient(new ApiVersion(version));

        // Act
        var response = await _httpClient.GetAsync("api/catalog/catalogtypes", TestContext.Current.CancellationToken);

        // Arrange
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        var result = JsonSerializer.Deserialize<List<CatalogType>>(body, _jsonSerializerOptions);

        // Assert
        Assert.Equal(8, result.Count);
        Assert.NotNull(result);
    }

    [Theory]
    [InlineData(1.0)]
    [InlineData(2.0)]
    public async Task GetAllCatalogBrands(double version)
    {
        var _httpClient = CreateHttpClient(new ApiVersion(version));

        // Act
        var response = await _httpClient.GetAsync("api/catalog/catalogbrands", TestContext.Current.CancellationToken);

        // Arrange
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        var result = JsonSerializer.Deserialize<List<CatalogBrand>>(body, _jsonSerializerOptions);

        // Assert
        Assert.Equal(13, result.Count);
        Assert.NotNull(result);
    }

    [Theory]
    [InlineData(1.0)]
    [InlineData(2.0)]
    public async Task AddCatalogItem(double version)
    {
        var _httpClient = CreateHttpClient(new ApiVersion(version));

        var id = version switch {
            1.0 => 10015,
            2.0 => 10016,
            _ => 0
        };

        // Act - 1
        var bodyContent = new CatalogItem("TestCatalog1") {
            Id = id,
            Description = "Test catalog description 1",
            Price = 11000.08m,
            PictureFileName = null,
            CatalogTypeId = 8,
            CatalogType = null,
            CatalogBrandId = 13,
            CatalogBrand = null,
            AvailableStock = 100,
            RestockThreshold = 10,
            MaxStockThreshold = 200,
            OnReorder = false
        };
        var response = await _httpClient.PostAsJsonAsync("/api/catalog/items", bodyContent, TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        // Act - 2
        response = await _httpClient.GetAsync($"/api/catalog/items/{id}", TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        var addedItem = JsonSerializer.Deserialize<CatalogItem>(body, _jsonSerializerOptions);

        // Assert - 1
        Assert.Equal(bodyContent.Id, addedItem.Id);

    }

    [Theory]
    [InlineData(1.0)]
    [InlineData(2.0)]
    public async Task DeleteCatalogItem(double version)
    {
        var _httpClient = CreateHttpClient(new ApiVersion(version));

        var id = version switch {
            1.0 => 5,
            2.0 => 6,
            _ => 0
        };

        //Act - 1
        var response = await _httpClient.DeleteAsync($"/api/catalog/items/{id}", TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        // Act - 2
        var response1 = await _httpClient.GetAsync($"/api/catalog/items/{id}", TestContext.Current.CancellationToken);
        var responseStatus = response1.StatusCode;

        // Assert - 1
        Assert.Equal("NoContent", response.StatusCode.ToString());
        Assert.Equal("NotFound", responseStatus.ToString());
    }

    [Theory]
    [InlineData(1.0)]
    [InlineData(2.0)]
    public async Task GetCatalogItemRejectsInvalidId(double version)
    {
        var httpClient = CreateHttpClient(new ApiVersion(version));

        var response = await httpClient.GetAsync("/api/catalog/items/0", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Theory]
    [InlineData(1.0)]
    [InlineData(2.0)]
    public async Task GetAndDeleteMissingCatalogItemReturnNotFound(double version)
    {
        var httpClient = CreateHttpClient(new ApiVersion(version));
        const int missingId = int.MaxValue;

        var getResponse = await httpClient.GetAsync($"/api/catalog/items/{missingId}", TestContext.Current.CancellationToken);
        var deleteResponse = await httpClient.DeleteAsync($"/api/catalog/items/{missingId}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, deleteResponse.StatusCode);
    }

    [Theory]
    [InlineData(1.0)]
    [InlineData(2.0)]
    public async Task CatalogPaginationBeyondLastPageReturnsEmptyData(double version)
    {
        var httpClient = CreateHttpClient(new ApiVersion(version));

        var response = await httpClient.GetAsync(
            "/api/catalog/items?pageIndex=1000&pageSize=10",
            TestContext.Current.CancellationToken);

        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<PaginatedItems<CatalogItem>>(
            _jsonSerializerOptions,
            TestContext.Current.CancellationToken);
        Assert.Empty(result!.Data);
        Assert.Equal(1000, result.PageIndex);
    }

    private const string RestOfBody = "\"catalogBrandId\":1,\"catalogTypeId\":1,\"price\":10.5,\"availableStock\":5,\"restockThreshold\":1,\"maxStockThreshold\":10";

    private static StringContent Json(string json) => new(json, System.Text.Encoding.UTF8, "application/json");

    private static async Task AssertProblemAsync(HttpResponseMessage response, HttpStatusCode expectedStatus = HttpStatusCode.BadRequest)
    {
        Assert.Equal(expectedStatus, response.StatusCode);
        var text = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        Assert.False(string.IsNullOrWhiteSpace(text));
        using var doc = JsonDocument.Parse(text);
        Assert.Equal(JsonValueKind.String, doc.RootElement.GetProperty("detail").ValueKind);
    }

    private async Task<int> GetCatalogCountAsync(HttpClient client)
    {
        var response = await client.GetAsync("/api/catalog/items?pageIndex=0&pageSize=1", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        return doc.RootElement.GetProperty("count").GetInt32();
    }

    private async Task<string> GetItemNameAsync(HttpClient client, int id)
    {
        var response = await client.GetAsync($"/api/catalog/items/{id}", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        return doc.RootElement.GetProperty("name").GetString();
    }

    [Fact]
    [Trait("Story", "BUG-17")]
    [Trait("TestCase", "TC-BUG-17-01")]
    public async Task TC_BUG_17_01_PostWithoutNameReturns400ProblemDetails()
    {
        var client = CreateHttpClient(new ApiVersion(2.0));

        var response = await client.PostAsync("/api/catalog/items", Json($"{{{RestOfBody},\"description\":\"No name\"}}"), TestContext.Current.CancellationToken);

        await AssertProblemAsync(response);
        Assert.Null(response.Headers.Location);
    }

    [Fact]
    [Trait("Story", "BUG-17")]
    [Trait("TestCase", "TC-BUG-17-02")]
    public async Task TC_BUG_17_02_PostWithNullNameReturns400ProblemDetails()
    {
        var client = CreateHttpClient(new ApiVersion(2.0));

        var response = await client.PostAsync("/api/catalog/items", Json($"{{\"name\":null,{RestOfBody},\"description\":\"Null name\"}}"), TestContext.Current.CancellationToken);

        await AssertProblemAsync(response);
    }

    [Fact]
    [Trait("Story", "BUG-17")]
    [Trait("TestCase", "TC-BUG-17-03")]
    public async Task TC_BUG_17_03_RejectedNamelessPostStoresNoItem()
    {
        var client = CreateHttpClient(new ApiVersion(2.0));
        var countBefore = await GetCatalogCountAsync(client);

        var response = await client.PostAsync("/api/catalog/items", Json($"{{{RestOfBody},\"description\":\"No name\"}}"), TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(countBefore, await GetCatalogCountAsync(client));
    }

    [Fact]
    [Trait("Story", "BUG-17")]
    [Trait("TestCase", "TC-BUG-17-04")]
    public async Task TC_BUG_17_04_PostWithNameReturns201WithLocation()
    {
        // The seeded catalog rows carry explicit ids, so move the id sequence past them before the server generates one.
        using (var scope = _webApplicationFactory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<CatalogContext>();
            await context.Database.ExecuteSqlRawAsync("SELECT setval(pg_get_serial_sequence('\"Catalog\"', 'Id'), (SELECT MAX(\"Id\") FROM \"Catalog\"))", TestContext.Current.CancellationToken);
        }

        var client = CreateHttpClient(new ApiVersion(2.0));

        var response = await client.PostAsync("/api/catalog/items", Json($"{{\"id\":0,\"name\":\"BUG-17 Valid Item\",{RestOfBody},\"description\":\"Valid\"}}"), TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var location = response.Headers.Location;
        Assert.NotNull(location);
        Assert.StartsWith("/api/catalog/items/", location.ToString());

        var get = await client.GetAsync(location, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, get.StatusCode);
        using var doc = JsonDocument.Parse(await get.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.Equal("BUG-17 Valid Item", doc.RootElement.GetProperty("name").GetString());
    }

    [Fact]
    [Trait("Story", "BUG-17")]
    [Trait("TestCase", "TC-BUG-17-05")]
    public async Task TC_BUG_17_05_PutV2WithoutNameReturns400AndLeavesItemUnchanged()
    {
        var client = CreateHttpClient(new ApiVersion(2.0));
        var nameBefore = await GetItemNameAsync(client, 1);

        var response = await client.PutAsync("/api/catalog/items/1", Json($"{{\"id\":1,{RestOfBody},\"description\":\"No name\"}}"), TestContext.Current.CancellationToken);

        await AssertProblemAsync(response);
        Assert.Equal(nameBefore, await GetItemNameAsync(client, 1));
    }

    [Fact]
    [Trait("Story", "BUG-17")]
    [Trait("TestCase", "TC-BUG-17-06")]
    public async Task TC_BUG_17_06_PutV1WithoutNameReturns400ProblemDetails()
    {
        var client = CreateHttpClient(new ApiVersion(1.0));

        var response = await client.PutAsync("/api/catalog/items", Json($"{{\"id\":1,{RestOfBody},\"description\":\"No name\"}}"), TestContext.Current.CancellationToken);

        await AssertProblemAsync(response);
    }

    [Fact]
    [Trait("Story", "BUG-17")]
    [Trait("TestCase", "TC-BUG-17-07")]
    public async Task TC_BUG_17_07_PutV2WithNameStillUpdatesItem()
    {
        var client = CreateHttpClient(new ApiVersion(2.0));
        var getResponse = await client.GetAsync("/api/catalog/items/1", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
        var item = JsonSerializer.Deserialize<CatalogItem>(await getResponse.Content.ReadAsStringAsync(TestContext.Current.CancellationToken), _jsonSerializerOptions);
        var originalName = item.Name;
        item.Name = "BUG-17 Renamed";

        var response = await client.PutAsJsonAsync("/api/catalog/items/1", item, TestContext.Current.CancellationToken);

        try
        {
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            Assert.Equal("BUG-17 Renamed", await GetItemNameAsync(client, 1));
        }
        finally
        {
            // Item 1 is shared with the name-search tests: put its seeded name back.
            item.Name = originalName;
            await client.PutAsJsonAsync("/api/catalog/items/1", item, TestContext.Current.CancellationToken);
        }
    }

    [Fact]
    [Trait("Story", "BUG-18")]
    [Trait("TestCase", "TC-BUG-18-01")]
    public async Task TC_BUG_18_01_PostWithExistingIdReturns409ProblemDetails()
    {
        var client = CreateHttpClient(new ApiVersion(2.0));

        var response = await client.PostAsync("/api/catalog/items", Json($"{{\"id\":1,\"name\":\"Duplicate of one\",{RestOfBody},\"description\":\"Plan case\"}}"), TestContext.Current.CancellationToken);

        await AssertProblemAsync(response, HttpStatusCode.Conflict);
        Assert.Null(response.Headers.Location);
    }

    [Fact]
    [Trait("Story", "BUG-18")]
    [Trait("TestCase", "TC-BUG-18-02")]
    public async Task TC_BUG_18_02_RejectedDuplicatePostLeavesItemAndCountUnchanged()
    {
        var client = CreateHttpClient(new ApiVersion(2.0));
        var countBefore = await GetCatalogCountAsync(client);
        var nameBefore = await GetItemNameAsync(client, 1);

        var response = await client.PostAsync("/api/catalog/items", Json($"{{\"id\":1,\"name\":\"Duplicate of one\",{RestOfBody},\"description\":\"Plan case\"}}"), TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal(nameBefore, await GetItemNameAsync(client, 1));
        Assert.Equal(countBefore, await GetCatalogCountAsync(client));
    }

    [Fact]
    [Trait("Story", "BUG-18")]
    [Trait("TestCase", "TC-BUG-18-03")]
    public async Task TC_BUG_18_03_PostWithUnusedExplicitIdReturns201AndKeepsId()
    {
        var client = CreateHttpClient(new ApiVersion(2.0));
        var id = Random.Shared.Next(1_000_000, int.MaxValue);

        var response = await client.PostAsync("/api/catalog/items", Json($"{{\"id\":{id},\"name\":\"Explicit id item\",{RestOfBody},\"description\":\"Plan case\"}}"), TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(response.Headers.Location);
        Assert.EndsWith($"/api/catalog/items/{id}", response.Headers.Location.ToString());

        var get = await client.GetAsync($"/api/catalog/items/{id}", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, get.StatusCode);
        using var doc = JsonDocument.Parse(await get.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.Equal(id, doc.RootElement.GetProperty("id").GetInt32());
        Assert.Equal("Explicit id item", doc.RootElement.GetProperty("name").GetString());
    }

    [Fact]
    [Trait("Story", "BUG-18")]
    [Trait("TestCase", "TC-BUG-18-04")]
    public async Task TC_BUG_18_04_PostingSameNewIdTwiceReturns409TheSecondTime()
    {
        var client = CreateHttpClient(new ApiVersion(2.0));
        var id = Random.Shared.Next(1_000_000, int.MaxValue);

        var first = await client.PostAsync("/api/catalog/items", Json($"{{\"id\":{id},\"name\":\"First of two\",{RestOfBody},\"description\":\"Plan case\"}}"), TestContext.Current.CancellationToken);
        var second = await client.PostAsync("/api/catalog/items", Json($"{{\"id\":{id},\"name\":\"Second of two\",{RestOfBody},\"description\":\"Plan case\"}}"), TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
        Assert.Equal("First of two", await GetItemNameAsync(client, id));
    }

    [Fact]
    [Trait("Story", "BUG-18")]
    [Trait("TestCase", "TC-BUG-18-05")]
    public async Task TC_BUG_18_05_PostWithIdZeroStillGeneratesId()
    {
        // The seeded catalog rows carry explicit ids, so move the id sequence past them before the server generates one.
        using (var scope = _webApplicationFactory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<CatalogContext>();
            await context.Database.ExecuteSqlRawAsync("SELECT setval(pg_get_serial_sequence('\"Catalog\"', 'Id'), (SELECT MAX(\"Id\") FROM \"Catalog\"))", TestContext.Current.CancellationToken);
        }

        var client = CreateHttpClient(new ApiVersion(2.0));

        var response = await client.PostAsync("/api/catalog/items", Json($"{{\"id\":0,\"name\":\"Generated id item\",{RestOfBody},\"description\":\"Plan case\"}}"), TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var location = response.Headers.Location;
        Assert.NotNull(location);
        Assert.Matches(@"/api/catalog/items/\d+$", location.ToString());
        var id = int.Parse(location.ToString().Split('/').Last());
        Assert.True(id > 101);
        Assert.Equal("Generated id item", await GetItemNameAsync(client, id));
    }

    [Fact]
    [Trait("Story", "BUG-18")]
    [Trait("TestCase", "TC-BUG-18-06")]
    public async Task TC_BUG_18_06_PostWithoutNameAndExistingIdReturns400Not409()
    {
        var client = CreateHttpClient(new ApiVersion(2.0));

        var response = await client.PostAsync("/api/catalog/items", Json($"{{\"id\":1,{RestOfBody},\"description\":\"No name\"}}"), TestContext.Current.CancellationToken);

        await AssertProblemAsync(response);
    }
}
