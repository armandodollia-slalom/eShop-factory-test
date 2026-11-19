using System.Net;
using System.Text;
using System.Text.Json;
using Asp.Versioning;
using Asp.Versioning.Http;

namespace eShop.Ordering.FunctionalTests;

// TC-BUG-56-01, -02, -03 and -05 (the ticket's own reproductions) run on the test stack: e2e/teststack/bug-56.spec.ts.
[Collection(OrderingApiCollection.Name)]
[Trait("Story", "BUG-56")]
public sealed class OrderDraftLineValidationTests
{
    private const string DraftUrl = "api/orders/draft";
    private const string ProblemJson = "application/problem+json";
    private const string BuyerId = "9e3163b9-1ae6-4652-9dc6-7898ab7b7a00";
    private const string QuantityDetail = "The quantity of each item must be at least 1.";
    private const string PriceDetail = "The unit price of an item cannot be negative.";

    private const string ValidFirstLine = """{"id":"1","productId":99,"productName":"Adventurer GPS Watch","unitPrice":10,"oldUnitPrice":10,"quantity":2,"pictureUrl":""}""";

    private readonly HttpClient _httpClient;

    public OrderDraftLineValidationTests(OrderingApiFixture fixture)
    {
        var handler = new ApiVersionHandler(new QueryStringApiVersionWriter(), new ApiVersion(1.0));
        _httpClient = fixture.CreateDefaultClient(handler);
    }

    private static string Line(string unitPrice, int quantity) =>
        $$"""{"id":"1","productId":99,"productName":"Adventurer GPS Watch","unitPrice":{{unitPrice}},"oldUnitPrice":{{unitPrice}},"quantity":{{quantity}},"pictureUrl":""}""";

    private static string Draft(params string[] lines) => $$"""{"buyerId":"{{BuyerId}}","items":[{{string.Join(",", lines)}}]}""";

    private async Task<(HttpResponseMessage Response, string Body)> PostDraftAsync(string requestBody)
    {
        var content = new StringContent(requestBody, Encoding.UTF8, "application/json");
        var response = await _httpClient.PostAsync(DraftUrl, content, TestContext.Current.CancellationToken);
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        return (response, body);
    }

    private static void AssertProblem(HttpResponseMessage response, string body, string expectedDetail)
    {
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(ProblemJson, response.Content.Headers.ContentType?.MediaType);
        Assert.False(string.IsNullOrWhiteSpace(body));
        using var problem = JsonDocument.Parse(body);
        Assert.Equal(400, problem.RootElement.GetProperty("status").GetInt32());
        Assert.Equal(expectedDetail, problem.RootElement.GetProperty("detail").GetString());
        Assert.False(problem.RootElement.TryGetProperty("orderItems", out _));
        Assert.False(problem.RootElement.TryGetProperty("total", out _));
    }

    private static JsonElement SingleOrderItem(JsonElement draft)
    {
        var items = draft.GetProperty("orderItems");
        Assert.Equal(1, items.GetArrayLength());
        return items[0];
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-56-04")]
    public async Task TC_BUG_56_04_DraftLineWithQuantity1IsAcceptedWith200()
    {
        var (response, body) = await PostDraftAsync(Draft(Line("10", 1)));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var draft = JsonDocument.Parse(body);
        var item = SingleOrderItem(draft.RootElement);
        Assert.Equal(99, item.GetProperty("productId").GetInt32());
        Assert.Equal(1, item.GetProperty("units").GetInt32());
        Assert.Equal(10m, draft.RootElement.GetProperty("total").GetDecimal());
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-56-06")]
    public async Task TC_BUG_56_06_DraftLineWithUnitPriceMinus001IsAnsweredWith400NamingThePrice()
    {
        var (response, body) = await PostDraftAsync(Draft(Line("-0.01", 1)));

        AssertProblem(response, body, PriceDetail);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-56-07")]
    public async Task TC_BUG_56_07_DraftLineWithUnitPrice0IsAcceptedWith200AndTotal0()
    {
        var (response, body) = await PostDraftAsync(Draft(Line("0", 3)));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var draft = JsonDocument.Parse(body);
        var item = SingleOrderItem(draft.RootElement);
        Assert.Equal(99, item.GetProperty("productId").GetInt32());
        Assert.Equal(3, item.GetProperty("units").GetInt32());
        Assert.Equal(0m, item.GetProperty("unitPrice").GetDecimal());
        Assert.Equal(0m, draft.RootElement.GetProperty("total").GetDecimal());
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-56-08")]
    public async Task TC_BUG_56_08_DraftWhoseSecondLineHasQuantity0IsRejectedWith400()
    {
        const string secondLine = """{"id":"2","productId":1,"productName":"Second draft item","unitPrice":19.5,"oldUnitPrice":19.5,"quantity":0,"pictureUrl":""}""";

        var (response, body) = await PostDraftAsync(Draft(ValidFirstLine, secondLine));

        AssertProblem(response, body, QuantityDetail);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-56-09")]
    public async Task TC_BUG_56_09_DraftWhoseSecondLineHasNegativeUnitPriceIsRejectedWith400()
    {
        const string secondLine = """{"id":"2","productId":1,"productName":"Second draft item","unitPrice":-5,"oldUnitPrice":-5,"quantity":1,"pictureUrl":""}""";

        var (response, body) = await PostDraftAsync(Draft(ValidFirstLine, secondLine));

        AssertProblem(response, body, PriceDetail);
    }
}
