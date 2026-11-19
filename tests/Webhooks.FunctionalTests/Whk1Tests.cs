using System.Net;
using System.Net.Http.Json;
using Asp.Versioning;
using Asp.Versioning.Http;

namespace eShop.Webhooks.FunctionalTests;

// WHK-1: the WebhookClient's Remove button sends DELETE /api/webhooks/{id}; the API must only delete the caller's own subscription.
[Trait("Story", "WHK-1")]
[Collection(WebhooksApiCollection.Name)]
public sealed class Whk1Tests(WebhooksApiFixture fixture)
{
    private const string Alice = "user-alice";
    private const string Bob = "user-bob";
    private const string AliceToken = "whk1-06-alice";

    private HttpClient CreateClient(string userId)
    {
        var handler = new ApiVersionHandler(new QueryStringApiVersionWriter(), new ApiVersion(1.0));
        var client = fixture.CreateDefaultClient(handler);
        client.DefaultRequestHeaders.Add("X-Test-User", userId);
        return client;
    }

    [Fact]
    [Trait("TestCase", "TC-WHK-1-06")]
    public async Task TC_WHK_1_06_DeleteOfAnotherUsersSubscriptionLeavesItInPlace()
    {
        var cancellationToken = TestContext.Current.CancellationToken;
        using var aliceClient = CreateClient(Alice);
        using var bobClient = CreateClient(Bob);

        var createResponse = await aliceClient.PostAsJsonAsync(
            "/api/webhooks",
            new WebhookSubscriptionRequest
            {
                Url = "https://receiver.test/hook",
                GrantUrl = "https://receiver.test/check",
                Token = AliceToken,
                Event = nameof(WebhookType.OrderPaid)
            },
            cancellationToken);
        Assert.True(createResponse.IsSuccessStatusCode, $"POST as {Alice} returned {(int)createResponse.StatusCode}");
        var before = await aliceClient.GetFromJsonAsync<List<WebhookSubscription>>("/api/webhooks", cancellationToken);
        var aliceId = Assert.Single(before!).Id;

        var deleteResponse = await bobClient.DeleteAsync($"/api/webhooks/{aliceId}", cancellationToken);
        var after = await aliceClient.GetAsync("/api/webhooks", cancellationToken);

        Assert.False(deleteResponse.IsSuccessStatusCode, $"DELETE as {Bob} returned {(int)deleteResponse.StatusCode}");
        Assert.Equal(HttpStatusCode.OK, after.StatusCode);
        var subscriptions = await after.Content.ReadFromJsonAsync<List<WebhookSubscription>>(cancellationToken);
        var subscription = Assert.Single(subscriptions!);
        Assert.Equal(aliceId, subscription.Id);
        Assert.Equal(AliceToken, subscription.Token);
    }
}
