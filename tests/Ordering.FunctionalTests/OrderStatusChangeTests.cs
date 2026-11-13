using System.Net;
using System.Text;
using System.Text.Json;
using Asp.Versioning;
using Asp.Versioning.Http;
using eShop.EventBus.Events;
using eShop.IntegrationEventLogEF;
using eShop.IntegrationEventLogEF.Services;
using eShop.Ordering.Domain.AggregatesModel.OrderAggregate;
using eShop.Ordering.Infrastructure;
using Microsoft.AspNetCore.Mvc.Testing;

namespace eShop.Ordering.FunctionalTests;

[Trait("Story", "BUG-10")]
public sealed class OrderStatusChangeTests : IClassFixture<OrderingApiFixture>
{
    private const int MissingOrder = 999999;

    private readonly OrderingApiFixture _fixture;
    private readonly HttpClient _httpClient;

    public OrderStatusChangeTests(OrderingApiFixture fixture)
    {
        _fixture = fixture;
        var handler = new ApiVersionHandler(new QueryStringApiVersionWriter(), new ApiVersion(1.0));
        // In the test host the entry assembly is the test runner, so the real event log service cannot resolve the
        // integration event types it publishes after a successful command. This wrapper stores events like the real
        // service but publishes nothing (there is no broker on this fixture either).
        var factory = fixture.WithWebHostBuilder(b => b.ConfigureServices(services =>
            services.AddTransient<IIntegrationEventLogService>(sp =>
                new StoreOnlyEventLogService(new IntegrationEventLogService<OrderingContext>(sp.GetRequiredService<OrderingContext>())))));
        _httpClient = factory.CreateDefaultClient(handler);
    }

    private sealed class StoreOnlyEventLogService(IIntegrationEventLogService inner) : IIntegrationEventLogService
    {
        public Task<IEnumerable<IntegrationEventLogEntry>> RetrieveEventLogsPendingToPublishAsync(Guid transactionId)
            => Task.FromResult<IEnumerable<IntegrationEventLogEntry>>([]);
        public Task SaveEventAsync(IntegrationEvent @event, Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction transaction)
            => inner.SaveEventAsync(@event, transaction);
        public Task MarkEventAsPublishedAsync(Guid eventId) => inner.MarkEventAsPublishedAsync(eventId);
        public Task MarkEventAsInProgressAsync(Guid eventId) => inner.MarkEventAsInProgressAsync(eventId);
        public Task MarkEventAsFailedAsync(Guid eventId) => inner.MarkEventAsFailedAsync(eventId);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-10-01")]
    public async Task TC_BUG_10_01_CancelShippedOrderReturnsConflict()
    {
        var n = await SeedOrderAsync(OrderStatus.Shipped);
        var response = await PutAsync("cancel", n, Guid.NewGuid());
        var problem = await ReadProblemAsync(response);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal(409, problem.GetProperty("status").GetInt32());
        Assert.Equal("Invalid order status change", problem.GetProperty("title").GetString());
        Assert.Equal("Is not possible to change the order status from Shipped to Cancelled.", problem.GetProperty("detail").GetString());
        Assert.Equal("shipped", await GetStatusAsync(n));
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-10-02")]
    public async Task TC_BUG_10_02_CancelPaidOrderReturnsConflict()
    {
        var n = await SeedOrderAsync(OrderStatus.Paid);
        var response = await PutAsync("cancel", n, Guid.NewGuid());
        var problem = await ReadProblemAsync(response);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("Is not possible to change the order status from Paid to Cancelled.", problem.GetProperty("detail").GetString());
        Assert.Equal("paid", await GetStatusAsync(n));
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-10-03")]
    public async Task TC_BUG_10_03_ShipSubmittedOrderReturnsConflict()
    {
        var n = await SeedOrderAsync(OrderStatus.Submitted);
        var response = await PutAsync("ship", n, Guid.NewGuid());
        var problem = await ReadProblemAsync(response);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("Invalid order status change", problem.GetProperty("title").GetString());
        Assert.Equal("Is not possible to change the order status from Submitted to Shipped.", problem.GetProperty("detail").GetString());
        Assert.Equal("submitted", await GetStatusAsync(n));
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-10-04")]
    public async Task TC_BUG_10_04_ShipShippedOrderReturnsConflict()
    {
        var n = await SeedOrderAsync(OrderStatus.Shipped);
        var response = await PutAsync("ship", n, Guid.NewGuid());
        var problem = await ReadProblemAsync(response);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("Is not possible to change the order status from Shipped to Shipped.", problem.GetProperty("detail").GetString());
        Assert.Equal("shipped", await GetStatusAsync(n));
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-10-05")]
    public async Task TC_BUG_10_05_CancelMissingOrderReturnsNotFound()
    {
        var requestId = Guid.NewGuid();
        var response = await PutAsync("cancel", MissingOrder, requestId);
        var problem = await ReadProblemAsync(response);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal(404, problem.GetProperty("status").GetInt32());
        Assert.Equal("Order not found", problem.GetProperty("title").GetString());
        Assert.Equal("Order 999999 was not found.", problem.GetProperty("detail").GetString());
        Assert.False(await RequestRecordExistsAsync(requestId));
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-10-06")]
    public async Task TC_BUG_10_06_ShipMissingOrderReturnsNotFound()
    {
        var requestId = Guid.NewGuid();
        var response = await PutAsync("ship", MissingOrder, requestId);
        var problem = await ReadProblemAsync(response);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("Order not found", problem.GetProperty("title").GetString());
        Assert.Equal("Order 999999 was not found.", problem.GetProperty("detail").GetString());
        Assert.False(await RequestRecordExistsAsync(requestId));
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-10-07")]
    public async Task TC_BUG_10_07_CancelEmptyRequestIdReturnsBadRequestBeforeLookup()
    {
        var response = await PutAsync("cancel", MissingOrder, Guid.Empty);
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains("Empty GUID is not valid for request ID", body);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-10-08")]
    public async Task TC_BUG_10_08_ShipEmptyRequestIdReturnsBadRequestBeforeLookup()
    {
        var response = await PutAsync("ship", MissingOrder, Guid.Empty);
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains("Empty GUID is not valid for request ID", body);
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-10-09")]
    public async Task TC_BUG_10_09_CancelSubmittedOrderStillSucceeds()
    {
        var n = await SeedOrderAsync(OrderStatus.Submitted);
        var response = await PutAsync("cancel", n, Guid.NewGuid());

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("cancelled", await GetStatusAsync(n));
    }

    [Fact]
    [Trait("TestCase", "TC-BUG-10-10")]
    public async Task TC_BUG_10_10_ShipPaidOrderStillSucceeds()
    {
        var n = await SeedOrderAsync(OrderStatus.Paid);
        var response = await PutAsync("ship", n, Guid.NewGuid());

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("shipped", await GetStatusAsync(n));
    }

    private async Task<HttpResponseMessage> PutAsync(string action, int orderNumber, Guid requestId)
    {
        var content = new StringContent(JsonSerializer.Serialize(new { orderNumber }), Encoding.UTF8, "application/json")
        {
            Headers = { { "x-requestid", requestId.ToString() } }
        };
        return await _httpClient.PutAsync($"api/orders/{action}", content, TestContext.Current.CancellationToken);
    }

    private async Task<JsonElement> ReadProblemAsync(HttpResponseMessage response)
    {
        var json = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        return JsonDocument.Parse(json).RootElement.Clone();
    }

    private async Task<string> GetStatusAsync(int orderNumber)
    {
        var response = await _httpClient.GetAsync($"api/orders/{orderNumber}", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        return JsonDocument.Parse(json).RootElement.GetProperty("status").GetString()?.ToLowerInvariant();
    }

    private async Task<bool> RequestRecordExistsAsync(Guid requestId)
    {
        using var scope = _fixture.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<OrderingContext>();
        return await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.AnyAsync(
            context.Set<eShop.Ordering.Infrastructure.Idempotency.ClientRequest>(),
            r => r.Id == requestId,
            TestContext.Current.CancellationToken);
    }

    private async Task<int> SeedOrderAsync(OrderStatus target)
    {
        using var scope = _fixture.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<OrderingContext>();

        // The status-change domain event handlers look the buyer up through the order's BuyerId.
        var buyer = new eShop.Ordering.Domain.AggregatesModel.BuyerAggregate.Buyer(Guid.NewGuid().ToString(), "Seed Buyer");
        context.Buyers.Add(buyer);
        await context.SaveChangesAsync(TestContext.Current.CancellationToken);

        var order = new Order("seed-user", "seed", new Address("street", "city", "state", "country", "zip"),
            cardTypeId: 2, cardNumber: "XXXXXXXXXXXX0005", cardSecurityNumber: "123",
            cardHolderName: "Seed User", cardExpiration: DateTime.UtcNow.AddYears(1), buyerId: buyer.Id);
        order.AddOrderItem(1, "Seed product", 10m, 0m, null, 1);

        if (target != OrderStatus.Submitted)
        {
            order.SetAwaitingValidationStatus();
            order.SetStockConfirmedStatus();
            order.SetPaidStatus();
        }
        if (target == OrderStatus.Shipped)
        {
            order.SetShippedStatus();
        }

        context.Orders.Add(order);
        await context.SaveChangesAsync(TestContext.Current.CancellationToken);
        return order.Id;
    }
}
