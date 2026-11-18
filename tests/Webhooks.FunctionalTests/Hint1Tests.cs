using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Asp.Versioning;
using Asp.Versioning.Http;
using eShop.EventBus.Abstractions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Webhooks.API.Infrastructure;
using Webhooks.API.IntegrationEvents;

namespace eShop.Webhooks.FunctionalTests;

// HINT-1: GET /api/webhooks and GET /api/webhooks/{id} return tokenHint ("…" + the token's last 4 characters, "…" alone
// for 1 to 4 characters, null without a token) instead of the token; registration and the grant check are unchanged.
[Trait("Story", "HINT-1")]
[Collection(WebhooksApiCollection.Name)]
public sealed class Hint1Tests(WebhooksApiFixture fixture)
{
    private const string Url = "https://receiver.test/webhook";
    private const string GrantUrl = "https://receiver.test/check";
    private const string OrderPaid = "OrderPaid";

    private static CancellationToken Cancellation => TestContext.Current.CancellationToken;

    private static HttpClient CreateClient(WebApplicationFactory<Program> factory, string userId)
    {
        var handler = new ApiVersionHandler(new QueryStringApiVersionWriter(), new ApiVersion(1.0));
        var client = factory.CreateDefaultClient(handler);
        client.DefaultRequestHeaders.Add("X-Test-User", userId);
        return client;
    }

    private HttpClient CreateClient(string userId) => CreateClient(fixture, userId);

    private static async Task<HttpResponseMessage> Register(HttpClient client, object body)
    {
        var response = await client.PostAsJsonAsync("/api/webhooks/", body, Cancellation);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return response;
    }

    private static Task<HttpResponseMessage> Register(HttpClient client, string token) =>
        Register(client, new { url = Url, grantUrl = GrantUrl, token, @event = OrderPaid });

    private static async Task<(HttpStatusCode Status, string Body)> Get(HttpClient client, string path)
    {
        var response = await client.GetAsync(path, Cancellation);
        return (response.StatusCode, await response.Content.ReadAsStringAsync(Cancellation));
    }

    private static JsonElement SingleListElement(string body)
    {
        using var document = JsonDocument.Parse(body);
        Assert.Equal(JsonValueKind.Array, document.RootElement.ValueKind);
        return Assert.Single(document.RootElement.EnumerateArray()).Clone();
    }

    private static int IdFromLocation(HttpResponseMessage created)
    {
        var location = created.Headers.Location!.OriginalString;
        Assert.Matches(@"^/api/webhooks/\d+$", location);
        return int.Parse(location["/api/webhooks/".Length..]);
    }

    [Fact]
    [Trait("TestCase", "TC-HINT-1-03")]
    public async Task TC_HINT_1_03_FiveCharacterTokenYieldsEllipsisAndLastFour()
    {
        using var client = CreateClient($"hint1-b5-{Guid.NewGuid():N}");
        await Register(client, "abcde");

        var (status, body) = await Get(client, "/api/webhooks/");

        Assert.Equal(HttpStatusCode.OK, status);
        var hint = SingleListElement(body).GetProperty("tokenHint").GetString();
        Assert.Equal("…bcde", hint);
        Assert.NotEqual("abcde", hint);
        Assert.NotEqual("…", hint);
    }

    [Fact]
    [Trait("TestCase", "TC-HINT-1-04")]
    public async Task TC_HINT_1_04_FourCharacterTokenYieldsEllipsisAlone()
    {
        using var client = CreateClient($"hint1-b4-{Guid.NewGuid():N}");
        await Register(client, "wxyz");

        var (status, body) = await Get(client, "/api/webhooks/");

        Assert.Equal(HttpStatusCode.OK, status);
        Assert.Equal("…", SingleListElement(body).GetProperty("tokenHint").GetString());
        Assert.DoesNotContain("wxyz", body);
    }

    [Fact]
    [Trait("TestCase", "TC-HINT-1-05")]
    public async Task TC_HINT_1_05_OneCharacterTokenYieldsEllipsisAlone()
    {
        using var client = CreateClient($"hint1-b1-{Guid.NewGuid():N}");
        var created = await Register(client, "q");

        var (status, body) = await Get(client, created.Headers.Location!.OriginalString);

        Assert.Equal(HttpStatusCode.OK, status);
        using var document = JsonDocument.Parse(body);
        Assert.Equal("…", document.RootElement.GetProperty("tokenHint").GetString());
        Assert.DoesNotContain(document.RootElement.EnumerateObject(), p => p.Name.Equals("token", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    [Trait("TestCase", "TC-HINT-1-06")]
    public async Task TC_HINT_1_06_SubscriptionWithoutTokenHasNullHint()
    {
        using var client = CreateClient($"hint1-none-{Guid.NewGuid():N}");
        await Register(client, new { url = Url, grantUrl = GrantUrl, @event = OrderPaid });

        var (status, body) = await Get(client, "/api/webhooks/");

        Assert.Equal(HttpStatusCode.OK, status);
        var element = SingleListElement(body);
        Assert.True(element.TryGetProperty("tokenHint", out var hint));
        Assert.Equal(JsonValueKind.Null, hint.ValueKind);
        Assert.DoesNotContain(element.EnumerateObject(), p => p.Name.Equals("token", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    [Trait("TestCase", "TC-HINT-1-07")]
    public async Task TC_HINT_1_07_SubscriptionWithEmptyTokenHasNullHint()
    {
        using var client = CreateClient($"hint1-empty-{Guid.NewGuid():N}");
        await Register(client, "");

        var (status, body) = await Get(client, "/api/webhooks/");

        Assert.Equal(HttpStatusCode.OK, status);
        Assert.Equal(JsonValueKind.Null, SingleListElement(body).GetProperty("tokenHint").ValueKind);
    }

    [Fact]
    [Trait("TestCase", "TC-HINT-1-08")]
    public async Task TC_HINT_1_08_ListAndSingleCarryTokenHintAndKeepTheOtherFields()
    {
        const string token = "fake-token-for-tests";
        const string destUrl = "https://receiver.test/fields";
        var user = $"hint1-fields-{Guid.NewGuid():N}";
        using var client = CreateClient(user);
        // Postgres keeps microseconds, so T0 is floored to a whole microsecond.
        var t0 = DateTime.UtcNow;
        t0 = t0.AddTicks(-(t0.Ticks % 10));
        var created = await Register(client, new { url = destUrl, grantUrl = GrantUrl, token, @event = OrderPaid });
        var t1 = DateTime.UtcNow;
        var id = IdFromLocation(created);

        var (listStatus, listBody) = await Get(client, "/api/webhooks/");
        var (singleStatus, singleBody) = await Get(client, $"/api/webhooks/{id}");

        Assert.Equal(HttpStatusCode.OK, listStatus);
        Assert.Equal(HttpStatusCode.OK, singleStatus);
        var listElement = SingleListElement(listBody);
        using var singleDocument = JsonDocument.Parse(singleBody);
        var single = singleDocument.RootElement;
        Assert.Equal(JsonValueKind.Object, single.ValueKind);
        Assert.DoesNotContain(token, listBody);
        Assert.DoesNotContain(token, singleBody);

        string[] expectedProperties = ["id", "type", "date", "destUrl", "tokenHint", "userId"];
        foreach (var element in new[] { listElement, single })
        {
            var names = element.EnumerateObject().Select(p => p.Name).ToArray();
            Assert.Equal(expectedProperties.Order(), names.Order());
            Assert.DoesNotContain(names, name => name.Equals("token", StringComparison.OrdinalIgnoreCase));
            Assert.Equal(id, element.GetProperty("id").GetInt32());
            Assert.Equal(3, element.GetProperty("type").GetInt32());
            Assert.Equal(destUrl, element.GetProperty("destUrl").GetString());
            Assert.Equal(user, element.GetProperty("userId").GetString());
            var date = element.GetProperty("date").GetDateTimeOffset().UtcDateTime;
            Assert.InRange(date, t0, t1);
            var hint = element.GetProperty("tokenHint").GetString();
            Assert.Equal("…ests", hint);
            Assert.Equal(5, hint!.Length);
        }

        foreach (var name in expectedProperties)
        {
            Assert.Equal(listElement.GetProperty(name).GetRawText(), single.GetProperty(name).GetRawText());
        }
    }

    [Fact]
    [Trait("TestCase", "TC-HINT-1-09")]
    public async Task TC_HINT_1_09_OtherUsersSubscriptionStillReturns404AndNoHint()
    {
        var guid = Guid.NewGuid().ToString("N");
        using var owner = CreateClient($"hint1-owner-{guid}");
        using var other = CreateClient($"hint1-other-{guid}");
        var created = await Register(owner, "fake-token-3c4d");
        var id = IdFromLocation(created);

        var (singleStatus, singleBody) = await Get(other, $"/api/webhooks/{id}");
        var (listStatus, listBody) = await Get(other, "/api/webhooks/");

        Assert.Equal(HttpStatusCode.NotFound, singleStatus);
        Assert.Equal($"Subscriptions {id} not found", JsonSerializer.Deserialize<string>(singleBody));
        Assert.DoesNotContain("tokenHint", singleBody);
        Assert.DoesNotContain("3c4d", singleBody);
        Assert.DoesNotContain("fake-token-3c4d", singleBody);
        Assert.Equal(HttpStatusCode.OK, listStatus);
        using var list = JsonDocument.Parse(listBody);
        Assert.Equal(JsonValueKind.Array, list.RootElement.ValueKind);
        Assert.Equal(0, list.RootElement.GetArrayLength());
    }

    [Fact]
    [Trait("TestCase", "TC-HINT-1-10")]
    public async Task TC_HINT_1_10_UnknownIdStillReturns404()
    {
        using var client = CreateClient($"hint1-missing-{Guid.NewGuid():N}");

        var (status, body) = await Get(client, "/api/webhooks/2147483647");

        Assert.Equal(HttpStatusCode.NotFound, status);
        Assert.Equal("Subscriptions 2147483647 not found", JsonSerializer.Deserialize<string>(body));
    }

    [Fact]
    [Trait("TestCase", "TC-HINT-1-14")]
    public async Task TC_HINT_1_14_RegistrationStoresTheExactTokenAndSendsItToTheGrantUrl()
    {
        const string token = "fake-token-for-tests-9z8y";
        var user = $"hint1-store-{Guid.NewGuid():N}";
        var receiver = new GrantReceiver();
        await using var host = new GrantReceiverWebhooksApiFactory(fixture, receiver);
        using var client = CreateClient(host, user);

        var created = await Register(client, new { url = Url, grantUrl = GrantUrl, token, @event = OrderPaid });
        var id = IdFromLocation(created);

        Assert.Equal($"/api/webhooks/{id}", created.Headers.Location!.OriginalString);
        var grant = Assert.Single(receiver.Requests);
        Assert.Equal(HttpMethod.Options, grant.Method);
        Assert.Equal(new Uri(GrantUrl), grant.Url);
        Assert.Equal(token, grant.Token);

        using var scope = host.Services.CreateScope();
        var row = await scope.ServiceProvider.GetRequiredService<WebhooksContext>()
            .Subscriptions.AsNoTracking().SingleAsync(s => s.Id == id, Cancellation);
        Assert.Equal(token, row.Token);
        Assert.Equal(user, row.UserId);
        Assert.Equal(Url, row.DestUrl);
    }

    [Fact]
    [Trait("TestCase", "TC-HINT-1-15")]
    public async Task TC_HINT_1_15_RejectedGrantStillReturns400AndStoresNothing()
    {
        using var client = CreateClient($"hint1-reject-{Guid.NewGuid():N}");

        var response = await client.PostAsJsonAsync(
            "/api/webhooks/",
            new { url = Url, grantUrl = "https://receiver.test/reject", token = "fake-token-for-tests", @event = OrderPaid },
            Cancellation);
        var body = await response.Content.ReadAsStringAsync(Cancellation);
        var (listStatus, listBody) = await Get(client, "/api/webhooks/");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("Invalid grant URL: https://receiver.test/reject", JsonSerializer.Deserialize<string>(body));
        Assert.Equal(HttpStatusCode.OK, listStatus);
        using var list = JsonDocument.Parse(listBody);
        Assert.Equal(JsonValueKind.Array, list.RootElement.ValueKind);
        Assert.Equal(0, list.RootElement.GetArrayLength());
    }

    [Fact]
    [Trait("TestCase", "TC-HINT-1-16")]
    public async Task TC_HINT_1_16_OrderPaidWebhookCallCarriesTheRegisteredTokenInFull()
    {
        const string token = "fake-token-for-tests-9z8y";
        var guid = Guid.NewGuid().ToString("N");
        var hookUrl = $"https://receiver.test/hook-{guid}";
        var receiver = new GrantReceiver();
        await using var host = new GrantReceiverWebhooksApiFactory(fixture, receiver);
        using var client = CreateClient(host, $"hint1-send-{guid}");

        await Register(client, new { url = hookUrl, grantUrl = $"https://receiver.test/check-{guid}", token, @event = OrderPaid });

        using (var scope = host.Services.CreateScope())
        {
            var handler = Assert.Single(scope.ServiceProvider
                .GetKeyedServices<IIntegrationEventHandler>(typeof(OrderStatusChangedToPaidIntegrationEvent)));
            await ((IIntegrationEventHandler<OrderStatusChangedToPaidIntegrationEvent>)handler)
                .Handle(new OrderStatusChangedToPaidIntegrationEvent(1, []));
        }

        // Every OrderPaid subscription in the shared database is called; only this test's hook URL is its own.
        var call = Assert.Single(receiver.Requests, r => r.Method == HttpMethod.Post && r.Url == new Uri(hookUrl));
        Assert.Equal(token, call.Token);
        using var payload = JsonDocument.Parse(call.Body);
        Assert.Equal("OrderPaid", payload.RootElement.GetProperty("Type").GetString());
    }
}
