using System.Threading;
using eShop.EventBus.Events;
using eShop.Ordering.API.Application.Commands;
using eShop.Ordering.API.Application.IntegrationEvents;
using eShop.Ordering.Domain.AggregatesModel.BuyerAggregate;
using eShop.Ordering.Domain.AggregatesModel.OrderAggregate;
using eShop.Ordering.Infrastructure;
using MediatR;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;

namespace eShop.Ordering.FunctionalTests;

// CANC-1 AC5: OrderRepository.GetAsync locks the order's row. Every status-change command and the domain event
// handlers it raises load the order through it, often again inside the same transaction. These tests send the
// commands the processors and the ship endpoint send, through the mediator and its TransactionBehavior, and check
// the normal flows still complete with the lock in place.
[Collection(OrderingApiCollection.Name)]
[Trait("Story", "CANC-1")]
public sealed class OrderStatusFlowWithRowLockTests : IAsyncDisposable
{
    private const int ProductId = 99;
    private static readonly TimeSpan CommandTimeout = TimeSpan.FromSeconds(60);

    private readonly WebApplicationFactory<Program> _factory;

    public OrderStatusFlowWithRowLockTests(OrderingApiFixture fixture)
    {
        // After a command commits, TransactionBehavior publishes its integration events to the event bus. In the
        // test host the event log cannot resolve their types (it scans the entry assembly, the test runner), so
        // that publish is skipped here; saving the events inside the command's transaction still runs.
        _factory = fixture.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
            services.AddTransient<IOrderingIntegrationEventService>(sp =>
                new SaveOnlyIntegrationEventService(ActivatorUtilities.CreateInstance<OrderingIntegrationEventService>(sp)))));
    }

    public ValueTask DisposeAsync() => _factory.DisposeAsync();

    [Fact]
    public async Task Uncancelled_order_goes_through_AwaitingValidation_StockConfirmed_and_Paid_and_is_shipped()
    {
        var ct = TestContext.Current.CancellationToken;
        var orderId = await CreateOrderAsync(OrderStatus.Submitted, ct);

        Assert.True(await SendAsync(new SetAwaitingValidationOrderStatusCommand(orderId), ct));
        Assert.Equal(OrderStatus.AwaitingValidation, await ReadStatusAsync(orderId, ct));

        Assert.True(await SendAsync(new SetStockConfirmedOrderStatusCommand(orderId), ct));
        Assert.Equal(OrderStatus.StockConfirmed, await ReadStatusAsync(orderId, ct));

        Assert.True(await SendAsync(new SetPaidOrderStatusCommand(orderId), ct));
        Assert.Equal(OrderStatus.Paid, await ReadStatusAsync(orderId, ct));

        Assert.True(await SendAsync(new ShipOrderCommand(orderId), ct));
        Assert.Equal(OrderStatus.Shipped, await ReadStatusAsync(orderId, ct));
    }

    [Fact]
    public async Task Stock_rejected_for_an_AwaitingValidation_order_cancels_it()
    {
        var ct = TestContext.Current.CancellationToken;
        var orderId = await CreateOrderAsync(OrderStatus.AwaitingValidation, ct);

        Assert.True(await SendAsync(new SetStockRejectedOrderStatusCommand(orderId, [ProductId]), ct));

        Assert.Equal(OrderStatus.Cancelled, await ReadStatusAsync(orderId, ct));
    }

    private async Task<bool> SendAsync(IRequest<bool> command, CancellationToken ct)
    {
        using var scope = _factory.Services.CreateScope();
        var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
        return await mediator.Send(command, ct).WaitAsync(CommandTimeout, ct);
    }

    private async Task<OrderStatus> ReadStatusAsync(int orderId, CancellationToken ct)
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<OrderingContext>();
        var order = await context.Orders.AsNoTracking().SingleAsync(o => o.Id == orderId, ct);
        return order.OrderStatus;
    }

    private async Task<int> CreateOrderAsync(OrderStatus status, CancellationToken ct)
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<OrderingContext>();

        var identity = Guid.NewGuid().ToString();
        var buyer = new Buyer(identity, "flow");
        context.Buyers.Add(buyer);
        await context.SaveChangesAsync(ct);

        var order = new Order(
            identity,
            "flow",
            new Address("15703 NE 61st Ct", "Redmond", "WA", "U.S.", "98052"),
            cardTypeId: 1,
            cardNumber: "4012888888881881",
            cardSecurityNumber: "123",
            cardHolderName: "flow",
            cardExpiration: DateTime.UtcNow.AddYears(1),
            buyerId: buyer.Id);
        order.AddOrderItem(ProductId, "Adventurer GPS Watch", 10.00m, 0m, "99.webp", 1);
        if (status == OrderStatus.AwaitingValidation)
        {
            order.SetAwaitingValidationStatus();
        }
        order.ClearDomainEvents();
        context.Orders.Add(order);
        await context.SaveChangesAsync(ct);
        return order.Id;
    }

    private sealed class SaveOnlyIntegrationEventService(IOrderingIntegrationEventService inner) : IOrderingIntegrationEventService
    {
        public Task AddAndSaveEventAsync(IntegrationEvent evt) => inner.AddAndSaveEventAsync(evt);

        public Task PublishEventsThroughEventBusAsync(Guid transactionId) => Task.CompletedTask;
    }
}
