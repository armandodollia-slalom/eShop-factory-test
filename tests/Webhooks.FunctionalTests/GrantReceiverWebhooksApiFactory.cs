using System.Collections.Concurrent;
using Microsoft.AspNetCore.Mvc.Testing;

namespace eShop.Webhooks.FunctionalTests;

// A Webhooks API host on the fixture's Postgres and RabbitMQ that keeps the real GrantUrlTesterService and sends every
// outgoing request of the default HttpClient (the grant check and the webhook calls) to a GrantReceiver instead of the network.
public sealed class GrantReceiverWebhooksApiFactory(WebhooksApiFixture fixture, GrantReceiver receiver) : WebApplicationFactory<Program>
{
    protected override IHost CreateHost(IHostBuilder builder)
    {
        builder.ConfigureHostConfiguration(config =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:webhooksdb"] = fixture.DatabaseConnectionString,
                ["ConnectionStrings:eventbus"] = fixture.RabbitMqConnectionString,
                ["Identity:Url"] = "http://identity.test"
            });
        });
        builder.ConfigureServices(services =>
        {
            services.AddSingleton<IStartupFilter>(new WebhooksApiFixture.TestAuthenticationStartupFilter());
            services.ConfigureHttpClientDefaults(http => http.ConfigurePrimaryHttpMessageHandler(() => new GrantReceiverHandler(receiver)));
        });
        return base.CreateHost(builder);
    }

    private sealed class GrantReceiverHandler(GrantReceiver receiver) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
            receiver.ReceiveAsync(request, cancellationToken);
    }
}

public sealed record ReceivedRequest(HttpMethod Method, Uri Url, string? Token, string Body);

// Records every request; answers OPTIONS with 200 and the request's X-eshop-whtoken echoed back (what a receiver that
// accepts the grant does) and every other request with 200.
public sealed class GrantReceiver
{
    private const string TokenHeader = "X-eshop-whtoken";

    private readonly ConcurrentQueue<ReceivedRequest> _requests = new();

    public IReadOnlyList<ReceivedRequest> Requests => [.. _requests];

    public async Task<HttpResponseMessage> ReceiveAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var token = request.Headers.TryGetValues(TokenHeader, out var values) ? values.Single() : null;
        var body = request.Content is null ? string.Empty : await request.Content.ReadAsStringAsync(cancellationToken);
        _requests.Enqueue(new ReceivedRequest(request.Method, request.RequestUri!, token, body));

        var response = new HttpResponseMessage(System.Net.HttpStatusCode.OK) { RequestMessage = request };
        if (request.Method == HttpMethod.Options && token is not null)
        {
            response.Headers.Add(TokenHeader, token);
        }
        return response;
    }
}
