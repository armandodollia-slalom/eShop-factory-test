using System.Reflection;
using System.Security.Claims;

using Aspire.Hosting;
using Aspire.Hosting.ApplicationModel;
using eShop.Catalog.API;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

namespace eShop.Catalog.FunctionalTests;

public sealed class CatalogApiFixture : WebApplicationFactory<Program>, IAsyncLifetime
{
    /// <summary>A request with this header is sent as an anonymous caller: no test identity is attached.</summary>
    public const string AnonymousHeader = "X-Test-Anonymous";

    /// <summary>A request with this header is sent as an authenticated customer: catalog scope, no admin role.</summary>
    public const string NonAdminHeader = "X-Test-Non-Admin";

    /// <summary>A request with this header is sent as an admin whose token lacks the catalog scope.</summary>
    public const string NoCatalogScopeHeader = "X-Test-No-Catalog-Scope";

    private readonly IHost _app;

    public IResourceBuilder<PostgresServerResource> Postgres { get; private set; }
    private string _postgresConnectionString;

    public CatalogApiFixture()
    {
        var options = new DistributedApplicationOptions { AssemblyName = typeof(CatalogApiFixture).Assembly.FullName, DisableDashboard = true };
        var appBuilder = DistributedApplication.CreateBuilder(options);
        Postgres = appBuilder.AddPostgres("CatalogDB")
            .WithImage("ankane/pgvector")
            .WithImageTag("latest");
        _app = appBuilder.Build();
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        builder.ConfigureHostConfiguration(config =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string>
            {
                { $"ConnectionStrings:{Postgres.Resource.Name}", _postgresConnectionString },
                });
        });
        // Catalog writes require a catalog admin; the existing tests exercise them as one.
        builder.ConfigureServices(services =>
        {
            services.AddSingleton<IStartupFilter>(new AutoAuthorizeStartupFilter());
        });
        return base.CreateHost(builder);
    }

    public new async Task DisposeAsync()
    {
        await base.DisposeAsync();
        await _app.StopAsync();
        if (_app is IAsyncDisposable asyncDisposable)
        {
            await asyncDisposable.DisposeAsync().ConfigureAwait(false);
        }
        else
        {
            _app.Dispose();
        }
    }

    public async ValueTask InitializeAsync()
    {
        await _app.StartAsync();
        _postgresConnectionString = await Postgres.Resource.GetConnectionStringAsync();
    }

    private class AutoAuthorizeStartupFilter : IStartupFilter
    {
        public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next)
        {
            return builder =>
            {
                builder.Use((context, nextMiddleware) =>
                {
                    var headers = context.Request.Headers;
                    if (!headers.ContainsKey(AnonymousHeader))
                    {
                        List<Claim> claims = [new Claim("sub", "catalog-functional-tests")];
                        if (!headers.ContainsKey(NoCatalogScopeHeader))
                        {
                            claims.Add(new Claim("scope", CatalogApi.Scope));
                        }
                        if (!headers.ContainsKey(NonAdminHeader))
                        {
                            claims.Add(new Claim(ClaimTypes.Role, CatalogApi.AdminRole));
                        }
                        // Replace (not append to) the anonymous principal: a failed policy then answers 403, not 401.
                        context.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "tests"));
                    }
                    return nextMiddleware(context);
                });
                next(builder);
            };
        }
    }
}
