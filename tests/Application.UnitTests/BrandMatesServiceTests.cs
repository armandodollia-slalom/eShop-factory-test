using System.Net;
using System.Text;
using System.Text.Json;
using eShop.WebAppComponents.Services;

namespace eShop.Application.UnitTests;

[TestClass]
[TestCategory("CAT-1")]
public class BrandMatesServiceTests
{
    private sealed class StubHandler(Func<HttpRequestMessage, HttpResponseMessage> respond) : HttpMessageHandler
    {
        public List<Uri?> Requests { get; } = [];

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Requests.Add(request.RequestUri);
            return Task.FromResult(respond(request));
        }
    }

    private static CatalogService Create(Func<HttpRequestMessage, HttpResponseMessage> respond, out StubHandler handler)
    {
        handler = new StubHandler(respond);
        return new CatalogService(new HttpClient(handler) { BaseAddress = new Uri("http://catalog.test/") });
    }

    private static HttpResponseMessage Json(HttpStatusCode status, string body) =>
        new(status) { Content = new StringContent(body, Encoding.UTF8, "application/json") };

    [TestMethod]
    [TestProperty("TestCase", "TC-CAT-1-18")]
    public async Task TC_CAT_1_18_GetBrandMatesSurfacesHttpErrorsAndBadJsonAsTheExceptionsThePageHandles()
    {
        // Step 1: 500 -> HttpRequestException with StatusCode 500
        var failing = Create(_ => Json(HttpStatusCode.InternalServerError, "{}"), out var failingHandler);
        var httpError = await Assert.ThrowsExactlyAsync<HttpRequestException>(() => failing.GetBrandMates(1001));
        Assert.AreEqual(HttpStatusCode.InternalServerError, httpError.StatusCode);
        Assert.AreEqual("/api/catalog/items/1001/brand-mates", failingHandler.Requests.Single()!.AbsolutePath);

        // Step 2: 200 with a body that is not JSON -> JsonException
        var badJson = Create(_ => Json(HttpStatusCode.OK, "not json"), out _);
        await Assert.ThrowsAsync<JsonException>(() => badJson.GetBrandMates(1001));

        // Step 3: handler times out -> TaskCanceledException
        var timeout = Create(_ => throw new TaskCanceledException("timeout"), out _);
        await Assert.ThrowsExactlyAsync<TaskCanceledException>(() => timeout.GetBrandMates(1001));

        // Step 4: 200 with [] -> empty list
        var empty = Create(_ => Json(HttpStatusCode.OK, "[]"), out _);
        var result = await empty.GetBrandMates(1001);
        Assert.IsEmpty(result);
    }
}
