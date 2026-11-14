using System.Net;
using System.Text.Json;
using System.Threading;
using Asp.Versioning;
using Asp.Versioning.Http;
using eShop.Ordering.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace eShop.Ordering.FunctionalTests;

/// <summary>
/// ORD-1: GET /api/orders returns itemCount (units summed over the order's lines) for each of the caller's orders.
/// Seeds the same orders as scenario `ord-1` (.factory/stack/scenarios/ord-1): alice 101 and 102, bob 103.
/// </summary>
[Collection(OrderingApiCollection.Name)]
[Trait("Story", "ORD-1")]
public sealed class OrderHistoryTests
{
    private const string AliceId = "50ddac7e-9b69-4d68-a91b-25100ef2e403";
    private const string BobId = "bc8b0071-21af-41ab-b1d2-15c4efc368df";

    private const int AliceOrderTwoLines = 101;
    private const int AliceOrderOneLine = 102;
    private const int BobOrder = 103;

    private static readonly SemaphoreSlim SeedLock = new(1, 1);
    private static bool s_seeded;

    private readonly OrderingApiFixture _fixture;
    private readonly HttpClient _httpClient;

    public OrderHistoryTests(OrderingApiFixture fixture)
    {
        _fixture = fixture;
        var handler = new ApiVersionHandler(new QueryStringApiVersionWriter(), new ApiVersion(1.0));
        _httpClient = fixture.CreateDefaultClient(handler);
    }

    [Fact]
    [Trait("TestCase", "TC-ORD-1-01")]
    public async Task TC_ORD_1_01_TwoLineOrderOfTwoAndOneUnitsHasItemCountThree()
    {
        await SeedAsync();

        var (status, orders) = await GetOrdersAsync(AliceId);

        Assert.Equal(HttpStatusCode.OK, status);
        var order = Assert.Single(orders, o => o.GetProperty("orderNumber").GetInt32() == AliceOrderTwoLines);
        var itemCount = order.GetProperty("itemCount");
        Assert.Equal(JsonValueKind.Number, itemCount.ValueKind);
        Assert.Equal(3, itemCount.GetInt32());
    }

    [Fact]
    [Trait("TestCase", "TC-ORD-1-02")]
    public async Task TC_ORD_1_02_OneLineOrderOfOneUnitHasItemCountOne()
    {
        await SeedAsync();

        var (status, orders) = await GetOrdersAsync(AliceId);

        Assert.Equal(HttpStatusCode.OK, status);
        var order = Assert.Single(orders, o => o.GetProperty("orderNumber").GetInt32() == AliceOrderOneLine);
        var itemCount = order.GetProperty("itemCount");
        Assert.Equal(JsonValueKind.Number, itemCount.ValueKind);
        Assert.Equal(1, itemCount.GetInt32());
    }

    [Fact]
    [Trait("TestCase", "TC-ORD-1-03")]
    public async Task TC_ORD_1_03_ExistingSummaryFieldsAreUnchanged()
    {
        await SeedAsync();

        var (status, orders) = await GetOrdersAsync(AliceId);

        Assert.Equal(HttpStatusCode.OK, status);
        Assert.Equal(2, orders.Count);

        var first = Assert.Single(orders, o => o.GetProperty("orderNumber").GetInt32() == AliceOrderTwoLines);
        Assert.Equal("Submitted", first.GetProperty("status").GetString());
        Assert.Equal(25.0, first.GetProperty("total").GetDouble());
        Assert.Equal(new DateTime(2026, 1, 10, 10, 0, 0, DateTimeKind.Utc), first.GetProperty("date").GetDateTime().ToUniversalTime());

        var second = Assert.Single(orders, o => o.GetProperty("orderNumber").GetInt32() == AliceOrderOneLine);
        Assert.Equal("Submitted", second.GetProperty("status").GetString());
        Assert.Equal(12.5, second.GetProperty("total").GetDouble());
        Assert.Equal(new DateTime(2026, 1, 11, 10, 0, 0, DateTimeKind.Utc), second.GetProperty("date").GetDateTime().ToUniversalTime());

        foreach (var order in orders)
        {
            var names = order.EnumerateObject().Select(p => p.Name).ToHashSet();
            foreach (var expected in new[] { "orderNumber", "date", "status", "total", "itemCount" })
            {
                Assert.Contains(expected, names);
            }
        }
    }

    [Fact]
    [Trait("TestCase", "TC-ORD-1-04")]
    public async Task TC_ORD_1_04_OnlyTheCallersOrdersAreReturned()
    {
        await SeedAsync();

        var (aliceStatus, aliceOrders) = await GetOrdersAsync(AliceId);
        var (bobStatus, bobOrders) = await GetOrdersAsync(BobId);

        Assert.Equal(HttpStatusCode.OK, aliceStatus);
        var aliceNumbers = aliceOrders.Select(o => o.GetProperty("orderNumber").GetInt32()).OrderBy(n => n).ToArray();
        Assert.Equal(new[] { AliceOrderTwoLines, AliceOrderOneLine }, aliceNumbers);
        Assert.DoesNotContain(BobOrder, aliceNumbers);

        Assert.Equal(HttpStatusCode.OK, bobStatus);
        var bobOrder = Assert.Single(bobOrders);
        Assert.Equal(BobOrder, bobOrder.GetProperty("orderNumber").GetInt32());
        Assert.Equal(4, bobOrder.GetProperty("itemCount").GetInt32());
        Assert.DoesNotContain(bobOrders, o => o.GetProperty("orderNumber").GetInt32() is AliceOrderTwoLines or AliceOrderOneLine);
    }

    private async Task<(HttpStatusCode Status, List<JsonElement> Orders)> GetOrdersAsync(string identityId)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "api/orders");
        request.Headers.Add(AutoAuthorizeMiddleware.IDENTITY_HEADER, identityId);
        using var response = await _httpClient.SendAsync(request, TestContext.Current.CancellationToken);
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        var orders = response.IsSuccessStatusCode
            ? JsonSerializer.Deserialize<List<JsonElement>>(body)!
            : [];
        return (response.StatusCode, orders);
    }

    /// <summary>Inserts the orders of scenario `ord-1` once per test run (the host migrates the database when it starts).</summary>
    private async Task SeedAsync()
    {
        await SeedLock.WaitAsync(TestContext.Current.CancellationToken);
        try
        {
            if (s_seeded)
            {
                return;
            }

            // Creating the client above already started the host, which migrates the ordering database.
            await using var scope = _fixture.Services.CreateAsyncScope();
            var context = scope.ServiceProvider.GetRequiredService<OrderingContext>();
            await context.Database.ExecuteSqlRawAsync(SeedSql, TestContext.Current.CancellationToken);
            s_seeded = true;
        }
        finally
        {
            SeedLock.Release();
        }
    }

    private static readonly string SeedSql = $"""
        INSERT INTO ordering.buyers ("Id", "IdentityGuid", "Name") VALUES
            (1001, '{AliceId}', 'alice'),
            (1002, '{BobId}', 'bob')
        ON CONFLICT DO NOTHING;
        INSERT INTO ordering.orders ("Id", "OrderDate", "Description", "BuyerId", "OrderStatus", "Address_Street", "Address_City", "Address_State", "Address_Country", "Address_ZipCode") VALUES
            ({AliceOrderTwoLines}, '2026-01-10T10:00:00Z', 'ord-1 order 101', 1001, 'Submitted', '1 Main St', 'Redmond', 'WA', 'U.S.', '98052'),
            ({AliceOrderOneLine}, '2026-01-11T10:00:00Z', 'ord-1 order 102', 1001, 'Submitted', '1 Main St', 'Redmond', 'WA', 'U.S.', '98052'),
            ({BobOrder}, '2026-01-12T10:00:00Z', 'ord-1 order 103', 1002, 'Submitted', '2 Oak Ave', 'Redmond', 'WA', 'U.S.', '98052')
        ON CONFLICT DO NOTHING;
        INSERT INTO ordering."orderItems" ("Id", "OrderId", "ProductId", "ProductName", "PictureUrl", "UnitPrice", "Discount", "Units") VALUES
            (1001, {AliceOrderTwoLines}, 1, 'Line A', '1.webp', 10.00, 0, 2),
            (1002, {AliceOrderTwoLines}, 2, 'Line B', '2.webp', 5.00, 0, 1),
            (1003, {AliceOrderOneLine}, 3, 'Single line', '3.webp', 12.50, 0, 1),
            (1004, {BobOrder}, 4, 'Bob line', '4.webp', 8.00, 0, 4)
        ON CONFLICT DO NOTHING;
        """;
}
