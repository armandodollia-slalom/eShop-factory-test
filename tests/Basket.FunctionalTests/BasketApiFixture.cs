using Grpc.Net.Client;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;

namespace eShop.Basket.FunctionalTests;

/// <summary>
/// One Redis container and one in-process Basket.API for the whole project: the API runs against the
/// fixture's Redis, with the JWT bearer scheme replaced by <see cref="TestAuthHandler"/>.
/// </summary>
public sealed class BasketApiFixture : IAsyncLifetime
{
    private BasketApiFactory? _factory;

    public RedisFixture Redis { get; } = new();

    public RedisBasketRepository Repository =>
        new(NullLogger<RedisBasketRepository>.Instance, Redis.Connection);

    public GrpcChannel CreateChannel()
    {
        var factory = _factory ?? throw new InvalidOperationException("The Basket.API fixture has not been initialized.");
        return GrpcChannel.ForAddress(factory.Server.BaseAddress, new GrpcChannelOptions { HttpHandler = factory.Server.CreateHandler() });
    }

    public async ValueTask InitializeAsync()
    {
        await Redis.InitializeAsync();
        _factory = new BasketApiFactory(Redis.ConnectionString);
        _factory.StartServer();
    }

    public async ValueTask DisposeAsync()
    {
        if (_factory is not null)
        {
            await _factory.DisposeAsync();
        }

        await Redis.DisposeAsync();
    }

    private sealed class BasketApiFactory(string redisConnectionString) : WebApplicationFactory<Program>
    {
        protected override IHost CreateHost(IHostBuilder builder)
        {
            builder.ConfigureHostConfiguration(config =>
            {
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    { "ConnectionStrings:redis", redisConnectionString },
                    // Never contacted: requests authenticate through the test scheme below.
                    { "Identity:Url", "http://identity.invalid" }
                });
            });
            return base.CreateHost(builder);
        }

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.ConfigureTestServices(services =>
            {
                services.AddAuthentication(options =>
                    {
                        options.DefaultScheme = TestAuthHandler.SchemeName;
                        options.DefaultAuthenticateScheme = TestAuthHandler.SchemeName;
                        options.DefaultChallengeScheme = TestAuthHandler.SchemeName;
                        options.DefaultForbidScheme = TestAuthHandler.SchemeName;
                    })
                    .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(TestAuthHandler.SchemeName, _ => { });
            });
        }
    }
}

[CollectionDefinition(Name)]
public sealed class BasketApiCollection : ICollectionFixture<BasketApiFixture>
{
    public const string Name = "BasketApi";
}
