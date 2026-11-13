using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Asp.Versioning;
using Asp.Versioning.Http;

namespace eShop.Webhooks.FunctionalTests;

// BUG-16: POST /api/webhooks/ must reject any event that is not a defined WebhookType member, including numeric strings.
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

    private static string NewUser() => $"owner-{Guid.NewGuid():N}";

    private static object Body(string @event) => new
    {
        url = "https://receiver.test/webhook",
        grantUrl = "https://receiver.test/check",
        token = "secret",
        @event
    };

    private static async Task AssertInvalidEventName(HttpResponseMessage response, string @event)
    {
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Null(response.Headers.Location);
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        var messages = doc.RootElement.GetProperty("errors").GetProperty("Event").EnumerateArray().Select(e => e.GetString()).ToList();
        Assert.Equal([$"{@event} is invalid event name"], messages);
        var keys = doc.RootElement.GetProperty("errors").EnumerateObject().Select(p => p.Name).ToList();
        Assert.DoesNotContain("Url", keys);
        Assert.DoesNotContain("GrantUrl", keys);
        Assert.Equal(["Event"], keys);
    }

    private async Task AssertRejectedAndNothingStored(string @event)
    {
        using var client = CreateClient(NewUser());
        var response = await client.PostAsJsonAsync("/api/webhooks/", Body(@event), TestContext.Current.CancellationToken);
        await AssertInvalidEventName(response, @event);
        var list = await client.GetFromJsonAsync<List<WebhookSubscription>>("/api/webhooks/", TestContext.Current.CancellationToken);
        Assert.Empty(list!);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-16-01")]
    public async Task TC_BUG_16_01_Numeric99IsRejectedWith400()
    {
        using var client = CreateClient(NewUser());
        var response = await client.PostAsJsonAsync("/api/webhooks/", Body("99"), TestContext.Current.CancellationToken);
        await AssertInvalidEventName(response, "99");
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-16-02")]
    public Task TC_BUG_16_02_RejectedNumericEventIsNotStored() => AssertRejectedAndNothingStored("99");

    [Fact]
    [Trait("TestCase", "TC-BUG-16-03")]
    public Task TC_BUG_16_03_Zero_IsRejected() => AssertRejectedAndNothingStored("0");

    [Fact]
    [Trait("TestCase", "TC-BUG-16-04")]
    public Task TC_BUG_16_04_Four_IsRejected() => AssertRejectedAndNothingStored("4");

    [Fact]
    [Trait("TestCase", "TC-BUG-16-05")]
    public Task TC_BUG_16_05_NegativeOne_IsRejected() => AssertRejectedAndNothingStored("-1");

    [Fact]
    [Trait("TestCase", "TC-BUG-16-06")]
    public Task TC_BUG_16_06_BeyondInt32_IsRejected() => AssertRejectedAndNothingStored("99999999999");

    [Fact]
    [Trait("TestCase", "TC-BUG-16-07")]
    public Task TC_BUG_16_07_NonNumericUnknownName_IsRejected() => AssertRejectedAndNothingStored("NotAnEvent");

    [Fact]
    [Trait("TestCase", "TC-BUG-16-08")]
    public async Task TC_BUG_16_08_NumericStringNamingDefinedMemberIsAccepted()
    {
        var user = NewUser();
        using var client = CreateClient(user);
        var response = await client.PostAsJsonAsync("/api/webhooks/", Body("1"), TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(response.Headers.Location);
        Assert.Matches(@"^/api/webhooks/\d+$", response.Headers.Location!.OriginalString);
        var subscription = await client.GetFromJsonAsync<WebhookSubscription>(response.Headers.Location, TestContext.Current.CancellationToken);
        Assert.Equal(WebhookType.CatalogItemPriceChange, subscription!.Type);
        Assert.Equal(user, subscription.UserId);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-16-09")]
    public async Task TC_BUG_16_09_NamedEventInDifferentCasingIsAccepted()
    {
        using var client = CreateClient(NewUser());
        var response = await client.PostAsJsonAsync("/api/webhooks/", Body("orderpaid"), TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var subscription = await client.GetFromJsonAsync<WebhookSubscription>(response.Headers.Location, TestContext.Current.CancellationToken);
        Assert.Equal(WebhookType.OrderPaid, subscription!.Type);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-16-10")]
    public async Task TC_BUG_16_10_EmptyEventIsRejected()
    {
        using var client = CreateClient(NewUser());
        var response = await client.PostAsJsonAsync("/api/webhooks/", Body(""), TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        var messages = doc.RootElement.GetProperty("errors").GetProperty("Event").EnumerateArray().Select(e => e.GetString()).ToList();
        Assert.Contains(messages, m => m!.Contains(" is invalid event name"));
    }

    // Enum.TryParse ORs comma-separated values ("1,2" -> 3 = OrderPaid); a combined value names no single member.
    [Theory]
    [Trait("TestCase", "TC-BUG-16-11")]
    [InlineData("1,2")]
    [InlineData("CatalogItemPriceChange,OrderShipped")]
    public Task TC_BUG_16_11_CommaCombinedEvent_IsRejected(string @event) => AssertRejectedAndNothingStored(@event);
}
