using Aspire.Hosting;
using Aspire.Hosting.ApplicationModel;
using Grpc.Net.Client;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace eShop.Basket.FunctionalTests;

/// <summary>
/// One real Redis (Aspire) for the project, and the Basket API hosted in-process against it. The host's clock is
/// <see cref="Clock"/>, its repository is the real <see cref="RedisBasketRepository"/> behind
/// <see cref="Repository"/> (which can inject concurrent writes for one buyer), and every gRPC call is authenticated
/// as the buyer in its <c>X-Test-User</c> header.
/// </summary>
public sealed class BasketApiFixture : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly IHost _app;
    private readonly IResourceBuilder<RedisResource> _redis;
    private IConnectionMultiplexer? _connection;
    private string _redisConnectionString = null!;

    public BasketApiFixture()
    {
        var builder = DistributedApplication.CreateBuilder(new DistributedApplicationOptions
        {
            AssemblyName = typeof(BasketApiFixture).Assembly.FullName,
            DisableDashboard = true
        });
        _redis = builder.AddRedis("redis");
        _app = builder.Build();
    }

    /// <summary>A connection to the fixture's Redis, for reading and writing raw values.</summary>
    public IConnectionMultiplexer Connection =>
        _connection ?? throw new InvalidOperationException("The Basket API fixture has not been initialized.");

    /// <summary>The time the hosted Basket API reads as "now".</summary>
    public SettableTimeProvider Clock { get; } = new(DateTimeOffset.UnixEpoch);

    /// <summary>The hosted Basket API's repository: the real Redis repository with per-buyer interception.</summary>
    public InterceptingBasketRepository Repository { get; private set; } = null!;

    public async ValueTask InitializeAsync()
    {
        await _app.StartAsync();
        var notifications = _app.Services.GetRequiredService<ResourceNotificationService>();
        await notifications.WaitForResourceHealthyAsync(_redis.Resource.Name);

        _redisConnectionString = (await _redis.Resource.ConnectionStringExpression.GetValueAsync(CancellationToken.None))!;
        _connection = await ConnectionMultiplexer.ConnectAsync(_redisConnectionString);
        Repository = new InterceptingBasketRepository(
            new RedisBasketRepository(NullLogger<RedisBasketRepository>.Instance, _connection));
    }

    /// <summary>A gRPC Basket client over the in-process host, authenticated as <paramref name="buyerId"/>.</summary>
    public BasketGrpcClient CreateBasketClient(string buyerId)
    {
        var channel = GrpcChannel.ForAddress(Server.BaseAddress, new GrpcChannelOptions { HttpHandler = Server.CreateHandler() });
        return new BasketGrpcClient(channel, buyerId);
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        builder.ConfigureHostConfiguration(config =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                [$"ConnectionStrings:{_redis.Resource.Name}"] = _redisConnectionString,
                ["Identity:Url"] = "http://identity.test"
            });
        });
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<IConnectionMultiplexer>();
            services.AddSingleton(Connection);
            services.RemoveAll<IBasketRepository>();
            services.AddSingleton<IBasketRepository>(Repository);
            services.RemoveAll<TimeProvider>();
            services.AddSingleton<TimeProvider>(Clock);
            services.AddSingleton<IStartupFilter>(new TestAuthenticationStartupFilter());
        });
        return base.CreateHost(builder);
    }

    public override async ValueTask DisposeAsync()
    {
        await base.DisposeAsync();
        if (_connection is not null)
        {
            await _connection.CloseAsync();
            _connection.Dispose();
        }

        await _app.StopAsync();
        if (_app is IAsyncDisposable asyncDisposable)
        {
            await asyncDisposable.DisposeAsync();
        }
        else
        {
            _app.Dispose();
        }
    }

    private sealed class TestAuthenticationStartupFilter : IStartupFilter
    {
        public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next) =>
            app =>
            {
                app.UseMiddleware<TestAuthenticationMiddleware>();
                next(app);
            };
    }
}

/// <summary>A clock whose time the test sets.</summary>
public sealed class SettableTimeProvider(DateTimeOffset utcNow) : TimeProvider
{
    public DateTimeOffset UtcNow { get; set; } = utcNow;

    public override DateTimeOffset GetUtcNow() => UtcNow;
}
