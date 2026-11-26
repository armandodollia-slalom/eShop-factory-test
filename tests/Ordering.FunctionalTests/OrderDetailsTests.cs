using System.Net;
using System.Text.Json;
using Asp.Versioning;
using Asp.Versioning.Http;
using eShop.Ordering.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace eShop.Ordering.FunctionalTests;

// ORDD-1: GET /api/orders/{orderId} returns an order only to its buyer; another buyer gets 404 and none of its data.
[Collection(OrderingApiCollection.Name)]
[Trait("Story", "ORDD-1")]
public sealed class OrderDetailsTests
{
    private const string AliceId = "50ddac7e-9b69-4d68-a91b-25100ef2e403";
    private const string BobId = "bc8b0071-21af-41ab-b1d2-15c4efc368df";

    // alice's order, inserted with ids no other test of this fixture uses
    private const int AliceBuyerId = 9101;
    private const int AliceOrderId = 9101;
    private const string AliceStreet = "100 Alice Lane";
    private const string AliceCity = "Seattle";
    private const string AliceProduct = "Alpine Fusion Goggles";

    private readonly OrderingApiFixture _fixture;
    private readonly HttpClient _httpClient;

    public OrderDetailsTests(OrderingApiFixture fixture)
    {
        _fixture = fixture;
        var handler = new ApiVersionHandler(new QueryStringApiVersionWriter(), new ApiVersion(1.0));
        _httpClient = fixture.CreateDefaultClient(handler);
    }

    // The buyer alice with one Cancelled order of one item; idempotent, so a rerun on the same database still finds it.
    private async Task SeedAliceOrderAsync()
    {
        using var scope = _fixture.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<OrderingContext>();
        var cancellationToken = TestContext.Current.CancellationToken;
        await context.Database.ExecuteSqlRawAsync(
            """
            INSERT INTO ordering.buyers ("Id", "IdentityGuid", "Name") VALUES ({0}, {1}, 'Alice') ON CONFLICT DO NOTHING;
            INSERT INTO ordering.orders ("Id", "BuyerId", "OrderStatus", "OrderDate", "Address_Street", "Address_City", "Address_State", "Address_Country", "Address_ZipCode")
                VALUES ({2}, {0}, 'Cancelled', '2026-11-02T09:00:00Z', {3}, {4}, 'WA', 'U.S.', '98101') ON CONFLICT DO NOTHING;
            INSERT INTO ordering."orderItems" ("Id", "OrderId", "ProductId", "ProductName", "UnitPrice", "Units", "Discount")
                VALUES ({2}, {2}, 3, {5}, 79.99, 3, 0) ON CONFLICT DO NOTHING;
            """,
            [AliceBuyerId, AliceId, AliceOrderId, AliceStreet, AliceCity, AliceProduct],
            cancellationToken);
    }

    private Task<HttpResponseMessage> GetOrderAsUserAsync(int orderId, string userId)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, $"api/orders/{orderId}");
        request.Headers.Add(AutoAuthorizeMiddleware.USER_HEADER, userId);
        return _httpClient.SendAsync(request, TestContext.Current.CancellationToken);
    }

    [Fact]
    [Trait("TestCase", "TC-ORDD-1-09")]
    public async Task TC_ORDD_1_09_AnotherBuyersOrderIsRefusedWith404()
    {
        await SeedAliceOrderAsync();

        // Step 1: alice reads her own order.
        var ownerResponse = await GetOrderAsUserAsync(AliceOrderId, AliceId);
        var ownerBody = await ownerResponse.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, ownerResponse.StatusCode);
        using (var order = JsonDocument.Parse(ownerBody))
        {
            Assert.Equal(AliceOrderId, order.RootElement.GetProperty("orderNumber").GetInt32());
        }

        // Step 2: bob asks for alice's order.
        var foreignResponse = await GetOrderAsUserAsync(AliceOrderId, BobId);
        var foreignBody = await foreignResponse.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, foreignResponse.StatusCode);
        Assert.DoesNotContain(AliceStreet, foreignBody);
        Assert.DoesNotContain(AliceCity, foreignBody);
        Assert.DoesNotContain(AliceProduct, foreignBody);
    }
}
