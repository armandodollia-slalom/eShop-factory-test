using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Asp.Versioning;
using Asp.Versioning.Http;

namespace eShop.Ordering.FunctionalTests;

// BUG-57: POST /api/orders answers 400 with a CardTypeId validation problem for a card type outside the seeded 1 Amex, 2 Visa, 3 MasterCard.
// The accepted card types and the card type 99 reproduction run on the test stack (e2e/teststack/bug-57.spec.ts).
[Collection(OrderingApiCollection.Name)]
[Trait("Story", "BUG-57")]
public sealed class CreateOrderCardTypeTests
{
    private const string OrdersUrl = "api/orders";
    private const string ProblemJson = "application/problem+json";
    private const string CardTypeIdKey = "CardTypeId";

    private readonly HttpClient _httpClient;

    public CreateOrderCardTypeTests(OrderingApiFixture fixture)
    {
        var handler = new ApiVersionHandler(new QueryStringApiVersionWriter(), new ApiVersion(1.0));
        _httpClient = fixture.CreateDefaultClient(handler);
    }

    // The order body of the plan's cases; only cardTypeId differs between them.
    private static StringContent OrderRequest(int cardTypeId)
    {
        var body = new JsonObject
        {
            ["userId"] = AutoAuthorizeMiddleware.IDENTITY_ID,
            ["userName"] = "TestUser",
            ["city"] = "Redmond",
            ["street"] = "15703 NE 61st Ct",
            ["state"] = "WA",
            ["country"] = "U.S.",
            ["zipCode"] = "98052",
            ["cardNumber"] = "4111111111111111",
            ["cardHolderName"] = "Test User",
            ["cardExpiration"] = "2030-12-31T00:00:00Z",
            ["cardSecurityNumber"] = "123",
            ["cardTypeId"] = cardTypeId,
            ["buyer"] = AutoAuthorizeMiddleware.IDENTITY_ID,
            ["items"] = new JsonArray(new JsonObject
            {
                ["id"] = "1",
                ["productId"] = 99,
                ["productName"] = "Adventurer GPS Watch",
                ["unitPrice"] = 199.99m,
                ["oldUnitPrice"] = 199.99m,
                ["quantity"] = 1,
                ["pictureUrl"] = "",
            }),
        };

        return new StringContent(body.ToJsonString(), Encoding.UTF8, "application/json")
        {
            Headers = { { "x-requestid", Guid.NewGuid().ToString() } }
        };
    }

    private async Task AssertRejectedWithCardTypeProblemAsync(int cardTypeId)
    {
        var response = await _httpClient.PostAsync(OrdersUrl, OrderRequest(cardTypeId), TestContext.Current.CancellationToken);
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(ProblemJson, response.Content.Headers.ContentType?.MediaType);
        Assert.False(string.IsNullOrWhiteSpace(body));
        using var problem = JsonDocument.Parse(body);
        Assert.Equal(400, problem.RootElement.GetProperty("status").GetInt32());
        var errors = problem.RootElement.GetProperty("errors");
        Assert.Equal([CardTypeIdKey], errors.EnumerateObject().Select(e => e.Name).ToArray());
        var message = Assert.Single(errors.GetProperty(CardTypeIdKey).EnumerateArray());
        Assert.Contains("not known", message.GetString());
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-57-04")]
    public Task TC_BUG_57_04_CardType4JustAboveKnownIsRejectedWithCardTypeIdProblem()
        => AssertRejectedWithCardTypeProblemAsync(4);

    [Fact]
    [Trait("TestCase", "TC-BUG-57-05")]
    public Task TC_BUG_57_05_CardType0JustBelowKnownIsRejectedWithCardTypeIdProblem()
        => AssertRejectedWithCardTypeProblemAsync(0);

    [Fact]
    [Trait("TestCase", "TC-BUG-57-06")]
    public Task TC_BUG_57_06_NegativeCardTypeIsRejectedWithCardTypeIdProblem()
        => AssertRejectedWithCardTypeProblemAsync(-1);
}
