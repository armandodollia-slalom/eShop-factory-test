using System.Net;
using System.Text.Json;
using Asp.Versioning;
using Asp.Versioning.Http;

namespace eShop.Ordering.FunctionalTests;

// ORDST-1: GET /api/orders?status=<name> answers 400 with a problem detail for a status that is not one of the six names.
[Collection(OrderingApiCollection.Name)]
[Trait("Story", "ORDST-1")]
public sealed class OrderStatusFilterTests
{
    private const string ProblemJson = "application/problem+json";

    private readonly HttpClient _httpClient;

    public OrderStatusFilterTests(OrderingApiFixture fixture)
    {
        // Adds api-version=1.0 to every request's query string.
        var handler = new ApiVersionHandler(new QueryStringApiVersionWriter(), new ApiVersion(1.0));
        _httpClient = fixture.CreateDefaultClient(handler);
    }

    [Fact]
    [Trait("TestCase", "TC-ORDST-1-06")]
    public async Task TC_ORDST_1_06_UnknownStatusDeliveredAnswers400ProblemDetail()
    {
        var root = await AssertProblem400("api/orders?status=Delivered");

        Assert.NotEqual(JsonValueKind.Array, root.ValueKind);
    }

    [Fact]
    [Trait("TestCase", "TC-ORDST-1-07")]
    public async Task TC_ORDST_1_07_EmptyStatusAnswers400ProblemDetail()
    {
        await AssertProblem400("api/orders?status=");
    }

    [Fact]
    [Trait("TestCase", "TC-ORDST-1-08")]
    public async Task TC_ORDST_1_08_NumericStatusAnswers400ProblemDetail()
    {
        await AssertProblem400("api/orders?status=4");
    }

    private async Task<JsonElement> AssertProblem400(string requestUri)
    {
        var response = await _httpClient.GetAsync(requestUri, TestContext.Current.CancellationToken);
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(ProblemJson, response.Content.Headers.ContentType?.MediaType);
        var root = JsonDocument.Parse(body).RootElement;
        Assert.Equal(JsonValueKind.Object, root.ValueKind);
        Assert.Equal(400, root.GetProperty("status").GetInt32());
        return root;
    }
}
