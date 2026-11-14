using System.Net;
using System.Net.Http.Json;
using Asp.Versioning;
using Asp.Versioning.Http;

namespace eShop.Webhooks.FunctionalTests;

// BUG-16: Webhooks.API must accept only the defined WebhookType names as the subscription event.
[Trait("Story", "BUG-16")]
public sealed class Bug16Tests(WebhooksApiFixture fixture) : IClassFixture<WebhooksApiFixture>
{
    private HttpClient CreateClient(string userId)
    {
        var handler = new ApiVersionHandler(new QueryStringApiVersionWriter(), new ApiVersion(1.0));
        var client = fixture.CreateDefaultClient(handler);
        client.DefaultRequestHeaders.Add("X-Test-User", userId);
        return client;
    }

    private static WebhookSubscriptionRequest Request(string eventName) => new()
    {
        Url = "https://receiver.test/webhook",
        GrantUrl = "https://receiver.test/check",
        Token = "secret",
        Event = eventName
    };

    private async Task AssertRejectedAndNothingStored(string eventName)
    {
        using var client = CreateClient($"owner-{Guid.NewGuid():N}");

        var response = await client.PostAsJsonAsync("/api/webhooks/", Request(eventName), TestContext.Current.CancellationToken);
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        var list = await client.GetFromJsonAsync<List<WebhookSubscription>>("/api/webhooks/", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains($"{eventName} is invalid event name", body);
        Assert.Empty(list!);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-16-01")]
    public Task TC_BUG_16_01_NumericEvent99IsRejected() => AssertRejectedAndNothingStored("99");

    [Fact]
    [Trait("TestCase", "TC-BUG-16-02")]
    public Task TC_BUG_16_02_NumericEvent0IsRejected() => AssertRejectedAndNothingStored("0");

    [Fact]
    [Trait("TestCase", "TC-BUG-16-03")]
    public Task TC_BUG_16_03_NumericEvent4IsRejected() => AssertRejectedAndNothingStored("4");

    [Fact]
    [Trait("TestCase", "TC-BUG-16-04")]
    public Task TC_BUG_16_04_NegativeNumericEventIsRejected() => AssertRejectedAndNothingStored("-1");

    [Fact]
    [Trait("TestCase", "TC-BUG-16-05")]
    public Task TC_BUG_16_05_CommaCombinedEventIsRejected() => AssertRejectedAndNothingStored("OrderShipped,OrderPaid");

    [Fact]
    [Trait("TestCase", "TC-BUG-16-06")]
    public Task TC_BUG_16_06_UndefinedNamedEventIsRejected() => AssertRejectedAndNothingStored("NotAnEvent");

    [Fact]
    [Trait("TestCase", "TC-BUG-16-07")]
    public async Task TC_BUG_16_07_EachDefinedEventNameIsAcceptedAndStored()
    {
        var owner = $"owner-{Guid.NewGuid():N}";
        using var client = CreateClient(owner);
        var names = new[] { "CatalogItemPriceChange", "OrderShipped", "OrderPaid" };

        var responses = new List<HttpResponseMessage>();
        foreach (var name in names)
        {
            responses.Add(await client.PostAsJsonAsync("/api/webhooks/", Request(name), TestContext.Current.CancellationToken));
        }
        var list = await client.GetFromJsonAsync<List<WebhookSubscription>>("/api/webhooks/", TestContext.Current.CancellationToken);

        Assert.All(responses, response =>
        {
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            Assert.StartsWith("/api/webhooks/", response.Headers.Location!.OriginalString);
        });
        Assert.Equal(3, list!.Count);
        Assert.All(list, subscription => Assert.Equal(owner, subscription.UserId));
        Assert.Equal(
            new[] { WebhookType.CatalogItemPriceChange, WebhookType.OrderShipped, WebhookType.OrderPaid },
            list.Select(subscription => subscription.Type).OrderBy(type => (int)type).ToArray());
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-16-08")]
    public async Task TC_BUG_16_08_EventNameIsMatchedCaseInsensitively()
    {
        var owner = $"owner-{Guid.NewGuid():N}";
        using var client = CreateClient(owner);

        var response = await client.PostAsJsonAsync("/api/webhooks/", Request("orderpaid"), TestContext.Current.CancellationToken);
        var list = await client.GetFromJsonAsync<List<WebhookSubscription>>("/api/webhooks/", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var subscription = Assert.Single(list!);
        Assert.Equal(owner, subscription.UserId);
        Assert.Equal(WebhookType.OrderPaid, subscription.Type);
    }
}
