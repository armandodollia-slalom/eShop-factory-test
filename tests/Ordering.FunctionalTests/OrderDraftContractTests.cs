using System.Net;
using System.Text;
using System.Text.Json;
using Asp.Versioning;
using Asp.Versioning.Http;

namespace eShop.Ordering.FunctionalTests;

// BUG-32: the OpenAPI document lists the 400 problem response of POST /api/orders/draft; the endpoint is unchanged.
// TC-BUG-32-01 and TC-BUG-32-04 run on the test stack (e2e/teststack/bug-32.spec.ts).
[Collection(OrderingApiCollection.Name)]
[Trait("Story", "BUG-32")]
public sealed class OrderDraftContractTests
{
    private const string OpenApiUrl = "openapi/v1.json";
    private const string DraftPath = "/api/orders/draft";
    private const string DraftUrl = "api/orders/draft";
    private const string ProblemJson = "application/problem+json";
    private const string ApplicationJson = "application/json";
    private const string SchemaRefPrefix = "#/components/schemas/";
    private const string BuyerId = "9e3163b9-1ae6-4652-9dc6-7898ab7b7a00";

    private readonly HttpClient _documentClient;
    private readonly HttpClient _apiClient;

    public OrderDraftContractTests(OrderingApiFixture fixture)
    {
        // The document is requested without an api-version query string; the API calls carry api-version=1.0.
        _documentClient = fixture.CreateDefaultClient();
        _apiClient = fixture.CreateDefaultClient(new ApiVersionHandler(new QueryStringApiVersionWriter(), new ApiVersion(1.0)));
    }

    private async Task<JsonDocument> GetOpenApiDocumentAsync()
    {
        var response = await _documentClient.GetAsync(OpenApiUrl, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        return JsonDocument.Parse(body);
    }

    private static JsonElement DraftResponses(JsonDocument document) =>
        document.RootElement.GetProperty("paths").GetProperty(DraftPath).GetProperty("post").GetProperty("responses");

    private static JsonElement ResolveSchemaRef(JsonDocument document, JsonElement schema, out string reference)
    {
        reference = schema.GetProperty("$ref").GetString();
        Assert.NotNull(reference);
        Assert.StartsWith(SchemaRefPrefix, reference);
        var name = reference[SchemaRefPrefix.Length..];
        Assert.True(
            document.RootElement.GetProperty("components").GetProperty("schemas").TryGetProperty(name, out var component),
            $"components.schemas has no '{name}'");
        return component;
    }

    private static StringContent Json(string body) => new(body, Encoding.UTF8, ApplicationJson);

    [Fact]
    [Trait("TestCase", "TC-BUG-32-02")]
    public async Task TC_BUG_32_02_Documented400ReferencesProblemDetailsSchema()
    {
        using var document = await GetOpenApiDocumentAsync();

        var schema = DraftResponses(document).GetProperty("400").GetProperty("content").GetProperty(ProblemJson).GetProperty("schema");
        var component = ResolveSchemaRef(document, schema, out _);

        var properties = component.GetProperty("properties");
        foreach (var key in new[] { "type", "title", "status", "detail", "instance" })
        {
            Assert.True(properties.TryGetProperty(key, out _), $"problem details schema has no property '{key}'");
        }
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-32-03")]
    public async Task TC_BUG_32_03_DocumentStillLists200OrderDraftDto()
    {
        using var document = await GetOpenApiDocumentAsync();

        var responses = DraftResponses(document);
        Assert.True(responses.TryGetProperty("200", out var ok), "responses has no '200'");
        Assert.True(ok.GetProperty("content").TryGetProperty(ApplicationJson, out var json), "200 has no application/json content");

        var component = ResolveSchemaRef(document, json.GetProperty("schema"), out var reference);
        Assert.Equal("#/components/schemas/OrderDraftDTO", reference);
        var properties = component.GetProperty("properties");
        Assert.True(properties.TryGetProperty("orderItems", out _), "OrderDraftDTO has no 'orderItems'");
        Assert.True(properties.TryGetProperty("total", out _), "OrderDraftDTO has no 'total'");
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-32-05")]
    public async Task TC_BUG_32_05_DraftWithOneItemStillReturns200WithTheOrderDraft()
    {
        var requestBody = $$"""{"buyerId":"{{BuyerId}}","items":[{"id":"1","productId":1,"productName":"Test item","unitPrice":10.50,"oldUnitPrice":0,"quantity":2,"pictureUrl":""}]}""";

        var response = await _apiClient.PostAsync(DraftUrl, Json(requestBody), TestContext.Current.CancellationToken);
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(ApplicationJson, response.Content.Headers.ContentType?.MediaType);
        using var draft = JsonDocument.Parse(body);
        var items = draft.RootElement.GetProperty("orderItems");
        Assert.Equal(1, items.GetArrayLength());
        Assert.Equal(1, items[0].GetProperty("productId").GetInt32());
        Assert.Equal(2, items[0].GetProperty("units").GetInt32());
        Assert.Equal(21.0m, draft.RootElement.GetProperty("total").GetDecimal());
    }
}
