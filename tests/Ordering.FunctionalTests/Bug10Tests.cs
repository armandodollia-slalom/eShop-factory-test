using System.Net;
using System.Text;
using System.Text.Json;
using Asp.Versioning;
using Asp.Versioning.Http;
using eShop.Ordering.Domain.AggregatesModel.BuyerAggregate;
using eShop.Ordering.Domain.AggregatesModel.OrderAggregate;
using eShop.Ordering.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace eShop.Ordering.FunctionalTests;

/// <summary>BUG-10: invalid order status changes return 409/404/400 instead of 500.</summary>
[Trait("Story", "BUG-10")]
public sealed class Bug10Tests : IClassFixture<OrderingApiFixture>
{
    private const string ShippedToCancelled = "Is not possible to change the order status from Shipped to Cancelled.";

    private readonly OrderingApiFixture _fixture;
    private readonly HttpClient _httpClient;

    public Bug10Tests(OrderingApiFixture fixture)
    {
        _fixture = fixture;
        var handler = new ApiVersionHandler(new QueryStringApiVersionWriter(), new ApiVersion(1.0));
        _httpClient = fixture.CreateDefaultClient(handler);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-10-01")]
    public async Task TC_BUG_10_01_CancelShippedOrderReturns409WithDomainMessage()
    {
        var id = await SeedOrderAsync(OrderStatus.Shipped);

        var response = await SendAsync("cancel", id, Guid.NewGuid());
        var body = await ReadBodyAsync(response);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        using var json = JsonDocument.Parse(body);
        Assert.Equal(409, json.RootElement.GetProperty("status").GetInt32());
        Assert.Equal(ShippedToCancelled, json.RootElement.GetProperty("detail").GetString());
        Assert.DoesNotContain("Cancel order failed to process.", body);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-10-02")]
    public async Task TC_BUG_10_02_CancelPaidOrderReturns409WithDomainMessage()
    {
        var id = await SeedOrderAsync(OrderStatus.Paid);

        var response = await SendAsync("cancel", id, Guid.NewGuid());

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("Is not possible to change the order status from Paid to Cancelled.", await DetailAsync(response));
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-10-03")]
    public async Task TC_BUG_10_03_ShipSubmittedOrderReturns409WithDomainMessage()
    {
        var id = await SeedOrderAsync(OrderStatus.Submitted);

        var response = await SendAsync("ship", id, Guid.NewGuid());

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("Is not possible to change the order status from Submitted to Shipped.", await DetailAsync(response));
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-10-04")]
    public async Task TC_BUG_10_04_ShipAlreadyShippedOrderReturns409()
    {
        var id = await SeedOrderAsync(OrderStatus.Shipped);

        var response = await SendAsync("ship", id, Guid.NewGuid());

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("Is not possible to change the order status from Shipped to Shipped.", await DetailAsync(response));
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-10-05")]
    public async Task TC_BUG_10_05_CancelNonexistentOrderReturns404()
    {
        var response = await SendAsync("cancel", 999999, Guid.NewGuid());

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-10-06")]
    public async Task TC_BUG_10_06_ShipNonexistentOrderReturns404()
    {
        var response = await SendAsync("ship", 999999, Guid.NewGuid());

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-10-07")]
    public async Task TC_BUG_10_07_CancelOrderNumberZeroReturns400WithValidationMessage()
    {
        var response = await SendAsync("cancel", 0, Guid.NewGuid());
        var body = await ReadBodyAsync(response);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.False(string.IsNullOrWhiteSpace(body));
        Assert.NotEqual(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-10-08")]
    public async Task TC_BUG_10_08_ShipOrderNumberZeroReturns400WithValidationMessage()
    {
        var response = await SendAsync("ship", 0, Guid.NewGuid());
        var body = await ReadBodyAsync(response);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.False(string.IsNullOrWhiteSpace(body));
        Assert.NotEqual(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-10-09")]
    public async Task TC_BUG_10_09_CancelEmptyRequestIdReturns400()
    {
        var id = await SeedOrderAsync(OrderStatus.Shipped);

        var response = await SendAsync("cancel", id, Guid.Empty);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains("Empty GUID is not valid for request ID", await ReadBodyAsync(response));
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-10-10")]
    public async Task TC_BUG_10_10_ShipEmptyRequestIdReturns400()
    {
        var id = await SeedOrderAsync(OrderStatus.Paid);

        var response = await SendAsync("ship", id, Guid.Empty);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains("Empty GUID is not valid for request ID", await ReadBodyAsync(response));
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-10-11")]
    public async Task TC_BUG_10_11_CancelSubmittedOrderReturns200AndSetsCancelled()
    {
        var id = await SeedOrderAsync(OrderStatus.Submitted);

        var response = await SendAsync("cancel", id, Guid.NewGuid());

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(string.Empty, await ReadBodyAsync(response));
        Assert.Equal("cancelled", await GetStatusAsync(id), ignoreCase: true);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-10-12")]
    public async Task TC_BUG_10_12_ShipPaidOrderReturns200AndSetsShipped()
    {
        var id = await SeedOrderAsync(OrderStatus.Paid);

        var response = await SendAsync("ship", id, Guid.NewGuid());

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("shipped", await GetStatusAsync(id), ignoreCase: true);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-10-13")]
    public async Task TC_BUG_10_13_RejectedCancelLeavesShippedOrderUnchanged()
    {
        var id = await SeedOrderAsync(OrderStatus.Shipped);

        var response = await SendAsync("cancel", id, Guid.NewGuid());

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("shipped", await GetStatusAsync(id), ignoreCase: true);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-10-14")]
    public async Task TC_BUG_10_14_RetryRejectedCancelWithSameRequestIdReturns409Again()
    {
        var id = await SeedOrderAsync(OrderStatus.Shipped);
        var requestId = Guid.NewGuid();

        var first = await SendAsync("cancel", id, requestId);
        var firstDetail = await DetailAsync(first);
        var second = await SendAsync("cancel", id, requestId);
        var secondDetail = await DetailAsync(second);

        Assert.Equal(HttpStatusCode.Conflict, first.StatusCode);
        Assert.Equal(ShippedToCancelled, firstDetail);
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
        Assert.Equal(ShippedToCancelled, secondDetail);
    }

    private Task<HttpResponseMessage> SendAsync(string action, int orderNumber, Guid requestId)
    {
        var content = new StringContent(JsonSerializer.Serialize(new { orderNumber }), Encoding.UTF8, "application/json")
        {
            Headers = { { "x-requestid", requestId.ToString() } }
        };
        return _httpClient.PutAsync($"api/orders/{action}", content, TestContext.Current.CancellationToken);
    }

    private static async Task<string> ReadBodyAsync(HttpResponseMessage response)
        => await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);

    private static async Task<string> DetailAsync(HttpResponseMessage response)
    {
        using var json = JsonDocument.Parse(await ReadBodyAsync(response));
        return json.RootElement.GetProperty("detail").GetString();
    }

    private async Task<string> GetStatusAsync(int orderId)
    {
        var response = await _httpClient.GetAsync($"api/orders/{orderId}", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var json = JsonDocument.Parse(await ReadBodyAsync(response));
        return json.RootElement.GetProperty("status").GetString();
    }

    /// <summary>Inserts an order owned by the authenticated test user, moved to the requested status.</summary>
    private async Task<int> SeedOrderAsync(OrderStatus status)
    {
        using var scope = _fixture.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<OrderingContext>();

        var buyer = await context.Buyers.FirstOrDefaultAsync(
            b => b.IdentityGuid == AutoAuthorizeMiddleware.IDENTITY_ID, TestContext.Current.CancellationToken);
        if (buyer is null)
        {
            buyer = new Buyer(AutoAuthorizeMiddleware.IDENTITY_ID, "alice");
            context.Buyers.Add(buyer);
            await context.SaveChangesAsync(TestContext.Current.CancellationToken);
        }

        var order = new Order(
            AutoAuthorizeMiddleware.IDENTITY_ID, "alice", new Address("1 Main St", "Redmond", "WA", "USA", "98052"),
            1, "XXXXXXXXXXXX0005", "123", "Alice Smith", DateTime.UtcNow.AddYears(1), buyer.Id);
        order.AddOrderItem(1, "Test product", 10m, 0m, string.Empty);

        if (status != OrderStatus.Submitted)
        {
            order.SetAwaitingValidationStatus();
            order.SetStockConfirmedStatus();
            order.SetPaidStatus();
        }
        if (status == OrderStatus.Shipped)
        {
            order.SetShippedStatus();
        }

        context.Orders.Add(order);
        await context.SaveChangesAsync(TestContext.Current.CancellationToken);
        return order.Id;
    }
}
