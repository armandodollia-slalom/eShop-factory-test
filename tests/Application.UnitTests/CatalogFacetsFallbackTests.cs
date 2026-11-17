using System.Net;
using System.Text;
using eShop.WebAppComponents.Catalog;
using eShop.WebAppComponents.Services;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace eShop.Application.UnitTests;

// RANGE-1: when the facets (filter counts and price range) cannot be loaded, the catalog
// page logs a warning and renders without them instead of failing.
[TestClass]
[TestCategory("RANGE-1")]
public class CatalogFacetsFallbackTests
{
    private const string BrandsJson = """[{"id":1,"brand":"Daybird"},{"id":2,"brand":"Gravitator"}]""";
    private const string TypesJson = """[{"id":1,"type":"Footwear"},{"id":7,"type":"Navigation"}]""";

    private sealed class StubHandler(Func<HttpRequestMessage, HttpResponseMessage> respond) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromResult(respond(request));
    }

    private sealed class CapturingLogger : ILogger
    {
        public List<(LogLevel Level, Exception? Exception)> Entries { get; } = [];

        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter) =>
            Entries.Add((logLevel, exception));
    }

    private sealed class TestNavigationManager : NavigationManager
    {
        public TestNavigationManager() => Initialize("http://shop.test/", "http://shop.test/");
    }

    private static HttpResponseMessage Json(HttpStatusCode status, string body) =>
        new(status) { Content = new StringContent(body, Encoding.UTF8, "application/json") };

    private static CatalogService Create(Func<HttpRequestMessage, HttpResponseMessage> respond) =>
        new(new HttpClient(new StubHandler(respond)) { BaseAddress = new Uri("http://catalog.test/") });

    // Brands and types load; the facets endpoint answers with `facets`.
    private static CatalogService CreateWithFacets(Func<HttpResponseMessage> facets) => Create(request =>
        request.RequestUri!.AbsolutePath switch
        {
            "/api/catalog/catalogBrands" => Json(HttpStatusCode.OK, BrandsJson),
            "/api/catalog/catalogTypes" => Json(HttpStatusCode.OK, TypesJson),
            "/api/catalog/items/facets" => facets(),
            var path => throw new InvalidOperationException($"Unexpected request {path}"),
        });

    [TestMethod]
    public async Task TryGetCatalogFacetsReturnsNullAndLogsAWarningWhenTheFacetsCallFails()
    {
        HttpResponseMessage[] failures =
        [
            Json(HttpStatusCode.InternalServerError, "{}"),
            Json(HttpStatusCode.OK, "not json"),
        ];

        foreach (var failure in failures)
        {
            var logger = new CapturingLogger();
            var service = CreateWithFacets(() => failure);

            var facets = await service.TryGetCatalogFacets([1], [7], logger);

            Assert.IsNull(facets);
            Assert.AreEqual(LogLevel.Warning, logger.Entries.Single().Level);
            Assert.IsNotNull(logger.Entries.Single().Exception);
        }
    }

    [TestMethod]
    public async Task TryGetCatalogFacetsReturnsNullWhenTheFacetsCallTimesOut()
    {
        var logger = new CapturingLogger();
        var service = Create(_ => throw new TaskCanceledException("timeout"));

        Assert.IsNull(await service.TryGetCatalogFacets(null, null, logger));
        Assert.AreEqual(LogLevel.Warning, logger.Entries.Single().Level);
    }

    [TestMethod]
    public async Task TryGetCatalogFacetsReturnsTheFacetsWhenTheCallSucceeds()
    {
        var logger = new CapturingLogger();
        var service = CreateWithFacets(() => Json(HttpStatusCode.OK,
            """{"brandCounts":[{"id":1,"count":10}],"typeCounts":[{"id":7,"count":11}],"brandTotal":10,"typeTotal":11,"minPrice":49.99,"maxPrice":449.99}"""));

        var facets = await service.TryGetCatalogFacets([1], null, logger);

        Assert.IsNotNull(facets);
        Assert.AreEqual(49.99m, facets.MinPrice);
        Assert.AreEqual(449.99m, facets.MaxPrice);
        Assert.IsEmpty(logger.Entries);
    }

    private static async Task<string> RenderCatalogSearch(CatalogService service, CatalogFacets? facets, bool facetsLoading)
    {
        await using var services = new ServiceCollection()
            .AddSingleton(service)
            .AddSingleton<NavigationManager, TestNavigationManager>()
            .BuildServiceProvider();
        await using var renderer = new HtmlRenderer(services, NullLoggerFactory.Instance);

        return await renderer.Dispatcher.InvokeAsync(async () =>
        {
            var root = await renderer.RenderComponentAsync<CatalogSearch>(ParameterView.FromDictionary(new Dictionary<string, object?>
            {
                [nameof(CatalogSearch.Facets)] = facets,
                [nameof(CatalogSearch.FacetsLoading)] = facetsLoading,
            }));
            await root.QuiescenceTask;
            return root.ToHtmlString();
        });
    }

    [TestMethod]
    public async Task CatalogSearchShowsTheFiltersWithoutCountBadgesWhenTheFacetsFailed()
    {
        var html = await RenderCatalogSearch(CreateWithFacets(() => Json(HttpStatusCode.InternalServerError, "{}")), facets: null, facetsLoading: false);

        StringAssert.Contains(html, "Daybird");
        StringAssert.Contains(html, "Navigation");
        Assert.DoesNotContain("catalog-search-tag-count", html);
        Assert.DoesNotContain("is-empty", html);
    }

    [TestMethod]
    public async Task CatalogSearchWaitsForTheFacetsSoTheBadgesAppearWithTheChips()
    {
        var service = CreateWithFacets(() => Json(HttpStatusCode.InternalServerError, "{}"));

        var loading = await RenderCatalogSearch(service, facets: null, facetsLoading: true);
        Assert.DoesNotContain("catalog-search-tag", loading);

        var loaded = await RenderCatalogSearch(service, new CatalogFacets([new(1, 10)], [new(7, 11)], 10, 11, 49.99m, 449.99m), facetsLoading: false);
        StringAssert.Contains(loaded, "Daybird");
        StringAssert.Contains(loaded, "catalog-search-tag-count");
    }
}
