namespace eShop.WebhookClient.Services;

public class WebhooksClient(HttpClient client)
{
    public Task<HttpResponseMessage> AddWebHookAsync(WebhookSubscriptionRequest payload)
    {
        return client.PostAsJsonAsync("/api/webhooks", payload);
    }

    public Task<HttpResponseMessage> DeleteWebhookAsync(int id)
    {
        return client.DeleteAsync($"/api/webhooks/{id}");
    }

    public async Task<IEnumerable<WebhookResponse>> LoadWebhooks()
    {
        return await client.GetFromJsonAsync<IEnumerable<WebhookResponse>>("/api/webhooks") ?? [];
    }
}
