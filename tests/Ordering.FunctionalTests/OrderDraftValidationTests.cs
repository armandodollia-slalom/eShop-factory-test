using System.Net;
using System.Text;
using System.Text.Json;
using Asp.Versioning;
using Asp.Versioning.Http;

namespace eShop.Ordering.FunctionalTests;

[Collection(OrderingApiCollection.Name)]
[Trait("Story", "BUG-15")]
public sealed class OrderDraftValidationTests
{
    private const string DraftUrl = "api/orders/draft";
    private const string ProblemJson = "application/problem+json";
    private const string BuyerId = "9e3163b9-1ae6-4652-9dc6-7898ab7b7a00";

    private readonly HttpClient _httpClient;

    public OrderDraftValidationTests(OrderingApiFixture fixture)
    {
        var handler = new ApiVersionHandler(new QueryStringApiVersionWriter(), new ApiVersion(1.0));
        _httpClient = fixture.CreateDefaultClient(handler);
    }

    private static StringContent Json(string body) => new(body, Encoding.UTF8, "application/json");

    [Fact]
    [Trait("TestCase", "TC-BUG-15-01")]
    public async Task TC_BUG_15_01_DraftWithoutBodyIsRejectedWith400()
    {
        // Act: no body and no Content-Type header
        var response = await _httpClient.PostAsync(DraftUrl, null, TestContext.Current.CancellationToken);
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.False(string.IsNullOrWhiteSpace(body));
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-15-02")]
    public async Task TC_BUG_15_02_RejectionOfMissingBodyIsProblemJson()
    {
        var response = await _httpClient.PostAsync(DraftUrl, null, TestContext.Current.CancellationToken);
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(ProblemJson, response.Content.Headers.ContentType?.MediaType);
        using var problem = JsonDocument.Parse(body);
        Assert.Equal(400, problem.RootElement.GetProperty("status").GetInt32());
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-15-03")]
    public async Task TC_BUG_15_03_DraftWithEmptyObjectIsRejectedWith400()
    {
        var response = await _httpClient.PostAsync(DraftUrl, Json("{}"), TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(ProblemJson, response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-15-04")]
    public async Task TC_BUG_15_04_DraftWithEmptyItemsIsRejectedWith400()
    {
        var response = await _httpClient.PostAsync(DraftUrl, Json($$"""{"buyerId":"{{BuyerId}}","items":[]}"""), TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(ProblemJson, response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-15-05")]
    public async Task TC_BUG_15_05_DraftWithNullItemsIsRejectedWith400()
    {
        var response = await _httpClient.PostAsync(DraftUrl, Json($$"""{"buyerId":"{{BuyerId}}","items":null}"""), TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(ProblemJson, response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-15-06")]
    public async Task TC_BUG_15_06_ValidDraftStillReturns200WithTheOrderDraft()
    {
        var requestBody = $$"""{"buyerId":"{{BuyerId}}","items":[{"id":"1","productId":1,"productName":"Test item","unitPrice":10.50,"oldUnitPrice":0,"quantity":2,"pictureUrl":""}]}""";

        var response = await _httpClient.PostAsync(DraftUrl, Json(requestBody), TestContext.Current.CancellationToken);
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var draft = JsonDocument.Parse(body);
        var items = draft.RootElement.GetProperty("orderItems");
        Assert.Equal(1, items.GetArrayLength());
        Assert.Equal(1, items[0].GetProperty("productId").GetInt32());
        Assert.Equal(2, items[0].GetProperty("units").GetInt32());
        Assert.Equal(21.0m, draft.RootElement.GetProperty("total").GetDecimal());
    }
}
