using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Asp.Versioning;
using Asp.Versioning.Http;
using eShop.Ordering.Domain.AggregatesModel.BuyerAggregate;
using eShop.Ordering.Domain.AggregatesModel.OrderAggregate;
using eShop.Ordering.Infrastructure;
using Microsoft.AspNetCore.Mvc;

namespace eShop.Ordering.FunctionalTests;

/// <summary>
/// BUG-10: PUT /api/orders/cancel and /api/orders/ship answer rule violations with 409, validation failures
/// with 400 and a missing order with 404 instead of 500. Orders are seeded in each status the cases need
/// (scenario .factory/stack/scenarios/bug-10 lists the same four statuses for the test stack).
/// </summary>
[Trait("Story", "BUG-10")]
public sealed class OrderStatusChangeTests : IClassFixture<OrderingApiFixture>
{
    private const int MissingOrderNumber = 9999;

    private readonly OrderingApiFixture _fixture;
    private readonly HttpClient _httpClient;

    public OrderStatusChangeTests(OrderingApiFixture fixture)
    {
        _fixture = fixture;
        var handler = new ApiVersionHandler(new QueryStringApiVersionWriter(), new ApiVersion(1.0));
        _httpClient = fixture.CreateDefaultClient(handler);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-10-01")]
    public async Task TC_BUG_10_01_CancelShippedOrderReturnsConflict()
    {
        var orderId = await SeedOrderAsync(OrderStatus.Shipped);

        var response = await PutAsync("cancel", orderId, Guid.NewGuid());

        await AssertConflictAsync(response, "Is not possible to change the order status from Shipped to Cancelled.");
        Assert.Equal("Shipped", await GetStatusAsync(orderId));
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-10-02")]
    public async Task TC_BUG_10_02_CancelPaidOrderReturnsConflict()
    {
        var orderId = await SeedOrderAsync(OrderStatus.Paid);

        var response = await PutAsync("cancel", orderId, Guid.NewGuid());

        await AssertConflictAsync(response, "Is not possible to change the order status from Paid to Cancelled.");
        Assert.Equal("Paid", await GetStatusAsync(orderId));
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-10-03")]
    public async Task TC_BUG_10_03_ShipSubmittedOrderReturnsConflict()
    {
        var orderId = await SeedOrderAsync(OrderStatus.Submitted);

        var response = await PutAsync("ship", orderId, Guid.NewGuid());

        await AssertConflictAsync(response, "Is not possible to change the order status from Submitted to Shipped.");
        Assert.Equal("Submitted", await GetStatusAsync(orderId));
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-10-04")]
    public async Task TC_BUG_10_04_ShipShippedOrderReturnsConflict()
    {
        var orderId = await SeedOrderAsync(OrderStatus.Shipped);

        var response = await PutAsync("ship", orderId, Guid.NewGuid());

        await AssertConflictAsync(response, "Is not possible to change the order status from Shipped to Shipped.");
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-10-05")]
    public async Task TC_BUG_10_05_CancelNonexistentOrderReturnsNotFound()
    {
        var response = await PutAsync("cancel", MissingOrderNumber, Guid.NewGuid());

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-10-06")]
    public async Task TC_BUG_10_06_ShipNonexistentOrderReturnsNotFound()
    {
        var response = await PutAsync("ship", MissingOrderNumber, Guid.NewGuid());

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-10-07")]
    public async Task TC_BUG_10_07_CancelOrderNumberZeroReturnsBadRequest()
    {
        var response = await PutAsync("cancel", 0, Guid.NewGuid());

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        Assert.Contains("No orderId found", body);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-10-08")]
    public async Task TC_BUG_10_08_CancelEmptyRequestIdStillReturnsBadRequest()
    {
        var orderId = await SeedOrderAsync(OrderStatus.Submitted);

        var response = await PutAsync("cancel", orderId, Guid.Empty);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains("Empty GUID is not valid for request ID", await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.Equal("Submitted", await GetStatusAsync(orderId));
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-10-09")]
    public async Task TC_BUG_10_09_ShipEmptyRequestIdStillReturnsBadRequest()
    {
        var orderId = await SeedOrderAsync(OrderStatus.Paid);

        var response = await PutAsync("ship", orderId, Guid.Empty);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains("Empty GUID is not valid for request ID", await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.Equal("Paid", await GetStatusAsync(orderId));
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-10-10")]
    public async Task TC_BUG_10_10_CancelSubmittedOrderStillReturnsOk()
    {
        var orderId = await SeedOrderAsync(OrderStatus.Submitted);

        var response = await PutAsync("cancel", orderId, Guid.NewGuid());

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Cancelled", await GetStatusAsync(orderId));
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-10-11")]
    public async Task TC_BUG_10_11_ShipPaidOrderStillReturnsOk()
    {
        var orderId = await SeedOrderAsync(OrderStatus.Paid);

        var response = await PutAsync("ship", orderId, Guid.NewGuid());

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Shipped", await GetStatusAsync(orderId));
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-10-12")]
    public async Task TC_BUG_10_12_RetryWithSameRequestIdAfterConflictIsReEvaluated()
    {
        var orderId = await SeedOrderAsync(OrderStatus.Shipped);
        var requestId = Guid.NewGuid();
        const string detail = "Is not possible to change the order status from Shipped to Cancelled.";

        var first = await PutAsync("cancel", orderId, requestId);
        await AssertConflictAsync(first, detail);

        var second = await PutAsync("cancel", orderId, requestId);
        await AssertConflictAsync(second, detail);

        Assert.Equal("Shipped", await GetStatusAsync(orderId));
    }

    private async Task<HttpResponseMessage> PutAsync(string action, int orderNumber, Guid requestId)
    {
        var content = new StringContent(JsonSerializer.Serialize(new { orderNumber }), Encoding.UTF8, "application/json")
        {
            Headers = { { "x-requestid", requestId.ToString() } }
        };
        return await _httpClient.PutAsync($"api/orders/{action}", content, TestContext.Current.CancellationToken);
    }

    private static async Task AssertConflictAsync(HttpResponseMessage response, string expectedDetail)
    {
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>(TestContext.Current.CancellationToken);
        Assert.NotNull(problem);
        Assert.Equal(409, problem.Status);
        Assert.Equal(expectedDetail, problem.Detail);
    }

    private async Task<string> GetStatusAsync(int orderId)
    {
        var response = await _httpClient.GetAsync($"api/orders/{orderId}", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        return json.RootElement.GetProperty("status").GetString();
    }

    /// <summary>Inserts an order in the given status through the domain model (no domain events are dispatched).</summary>
    private async Task<int> SeedOrderAsync(OrderStatus status)
    {
        using var scope = _fixture.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<OrderingContext>();

        // The cancel/ship domain event handlers look up the order's buyer, so every order needs one.
        var buyer = new Buyer(Guid.NewGuid().ToString(), "alice");
        context.Buyers.Add(buyer);
        await context.SaveChangesAsync(TestContext.Current.CancellationToken);

        var order = new Order(buyer.IdentityGuid, "alice",
            new Address("1 Main St", "Redmond", "WA", "US", "98052"),
            cardTypeId: 2, cardNumber: "XXXXXXXXXXXX0005", cardSecurityNumber: "123", cardHolderName: "Alice Smith",
            cardExpiration: DateTime.UtcNow.AddYears(2), buyerId: buyer.Id);

        switch (status)
        {
            case OrderStatus.Paid:
            case OrderStatus.Shipped:
                order.SetAwaitingValidationStatus();
                order.SetStockConfirmedStatus();
                order.SetPaidStatus();
                if (status == OrderStatus.Shipped)
                {
                    order.SetShippedStatus();
                }
                break;
            case OrderStatus.Cancelled:
                order.SetCancelledStatus();
                break;
        }

        context.Orders.Add(order);
        await context.SaveChangesAsync(TestContext.Current.CancellationToken);
        return order.Id;
    }
}
