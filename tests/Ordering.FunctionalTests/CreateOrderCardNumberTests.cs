using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Asp.Versioning;
using Asp.Versioning.Http;

namespace eShop.Ordering.FunctionalTests;

// BUG-30: POST /api/orders answers 400 with a CardNumber validation problem for a missing or short card number, and creates no order.
[Collection(OrderingApiCollection.Name)]
[Trait("Story", "BUG-30")]
public sealed class CreateOrderCardNumberTests
{
    private const string OrdersUrl = "api/orders";
    private const string ProblemJson = "application/problem+json";
    private const string CardNumberKey = "CardNumber";

    private readonly HttpClient _httpClient;

    public CreateOrderCardNumberTests(OrderingApiFixture fixture)
    {
        var handler = new ApiVersionHandler(new QueryStringApiVersionWriter(), new ApiVersion(1.0));
        _httpClient = fixture.CreateDefaultClient(handler);
    }

    // The order body of the plan's cases; a null cardNumber leaves the property out of the JSON.
    private static StringContent OrderRequest(string requestId, string cardNumber)
    {
        var body = new JsonObject
        {
            ["userId"] = AutoAuthorizeMiddleware.IDENTITY_ID,
            ["userName"] = "bob",
            ["city"] = "Redmond",
            ["street"] = "15703 NE 61st Ct",
            ["state"] = "WA",
            ["country"] = "U.S.",
            ["zipCode"] = "98052",
        };
        if (cardNumber is not null)
        {
            body["cardNumber"] = cardNumber;
        }
        body["cardHolderName"] = "Bob Smith";
        body["cardExpiration"] = "2030-12-31T00:00:00Z";
        body["cardSecurityNumber"] = "123";
        body["cardTypeId"] = 2;
        body["buyer"] = "bob";
        body["items"] = new JsonArray(new JsonObject
        {
            ["id"] = "1",
            ["productId"] = 99,
            ["productName"] = "Adventurer GPS Watch",
            ["unitPrice"] = 10.00m,
            ["oldUnitPrice"] = 10.00m,
            ["quantity"] = 1,
            ["pictureUrl"] = null,
        });

        return new StringContent(body.ToJsonString(), Encoding.UTF8, "application/json")
        {
            Headers = { { "x-requestid", requestId } }
        };
    }

    private async Task<JsonElement[]> GetOrdersAsync()
    {
        var response = await _httpClient.GetAsync(OrdersUrl, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var orders = JsonDocument.Parse(await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        return orders.RootElement.EnumerateArray().Select(o => o.Clone()).ToArray();
    }

    // Steps 1 and 2 of TC-BUG-30-01..04: the order is rejected with a CardNumber validation problem and the caller's order count stays N.
    private async Task AssertRejectedWithCardNumberProblemAsync(string requestId, string cardNumber)
    {
        var before = (await GetOrdersAsync()).Length;

        var response = await _httpClient.PostAsync(OrdersUrl, OrderRequest(requestId, cardNumber), TestContext.Current.CancellationToken);
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(ProblemJson, response.Content.Headers.ContentType?.MediaType);
        using var problem = JsonDocument.Parse(body);
        Assert.True(problem.RootElement.GetProperty("errors").TryGetProperty(CardNumberKey, out var messages), $"errors has no {CardNumberKey} key: {body}");
        Assert.Equal(JsonValueKind.Array, messages.ValueKind);
        Assert.Contains(messages.EnumerateArray(), m => !string.IsNullOrWhiteSpace(m.GetString()));

        Assert.Equal(before, (await GetOrdersAsync()).Length);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-30-01")]
    public Task TC_BUG_30_01_CardNumber12IsRejectedWithCardNumberProblem()
        => AssertRejectedWithCardNumberProblemAsync("0b6f6a52-3d0e-4c8e-9f41-5a2d7c1e8b30", "12");

    [Fact]
    [Trait("TestCase", "TC-BUG-30-02")]
    public Task TC_BUG_30_02_EmptyCardNumberIsRejectedWithCardNumberProblem()
        => AssertRejectedWithCardNumberProblemAsync("0b6f6a52-3d0e-4c8e-9f41-5a2d7c1e8b32", "");

    [Fact]
    [Trait("TestCase", "TC-BUG-30-03")]
    public Task TC_BUG_30_03_MissingCardNumberIsRejectedWithCardNumberProblem()
        => AssertRejectedWithCardNumberProblemAsync("0b6f6a52-3d0e-4c8e-9f41-5a2d7c1e8b33", null);

    [Fact]
    [Trait("TestCase", "TC-BUG-30-04")]
    public Task TC_BUG_30_04_ThreeDigitCardNumberIsRejectedWithCardNumberProblem()
        => AssertRejectedWithCardNumberProblemAsync("0b6f6a52-3d0e-4c8e-9f41-5a2d7c1e8b34", "123");

    // TC-BUG-30-05 (a valid card number creates an order) runs on the test stack only (e2e/teststack/bug-30.spec.ts):
    // in this in-process host IntegrationEventLogService resolves event types from the entry assembly (the test runner),
    // so any order that passes validation fails while publishing its integration events.
}
