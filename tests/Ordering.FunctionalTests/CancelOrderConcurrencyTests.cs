using System.Threading;
using eShop.Ordering.Domain.AggregatesModel.OrderAggregate;
using eShop.Ordering.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace eShop.Ordering.FunctionalTests;

// CANC-1 AC2: a cancel and a concurrent status change (here the payment) cannot overwrite each other.
// Loading an order for a status change locks its row, so the payment that started after the cancel
// waits for it and then sees Cancelled, and the order never becomes Paid.
[Collection(OrderingApiCollection.Name)]
[Trait("Story", "CANC-1")]
public sealed class CancelOrderConcurrencyTests
{
    private readonly OrderingApiFixture _fixture;

    public CancelOrderConcurrencyTests(OrderingApiFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task Payment_that_loads_the_order_during_a_cancel_waits_and_leaves_it_cancelled()
    {
        var ct = TestContext.Current.CancellationToken;
        var orderId = await CreateStockConfirmedOrderAsync(ct);

        using var cancelScope = _fixture.Services.CreateScope();
        var cancelContext = cancelScope.ServiceProvider.GetRequiredService<OrderingContext>();
        var cancelRepository = cancelScope.ServiceProvider.GetRequiredService<IOrderRepository>();
        using var paymentScope = _fixture.Services.CreateScope();
        var paymentContext = paymentScope.ServiceProvider.GetRequiredService<OrderingContext>();
        var paymentRepository = paymentScope.ServiceProvider.GetRequiredService<IOrderRepository>();

        var paymentLoaded = new TaskCompletionSource<OrderStatus>(TaskCreationOptions.RunContinuationsAsynchronously);
        Task payment = null;

        // Like TransactionBehavior, each side runs its transaction through its context's execution strategy.
        await cancelContext.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
        {
            await using var cancelTransaction = await cancelContext.Database.BeginTransactionAsync(ct);
            var orderToCancel = await cancelRepository.GetAsync(orderId);

            payment = paymentContext.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
            {
                await using var paymentTransaction = await paymentContext.Database.BeginTransactionAsync(ct);
                var orderToPay = await paymentRepository.GetAsync(orderId);
                paymentLoaded.TrySetResult(orderToPay.OrderStatus);
                orderToPay.SetPaidStatus();
                await paymentContext.SaveChangesAsync(ct);
                await paymentTransaction.CommitAsync(ct);
            });

            // The payment cannot read the order while the cancel holds it.
            await Task.Delay(TimeSpan.FromMilliseconds(500), ct);
            Assert.False(paymentLoaded.Task.IsCompleted);

            orderToCancel.SetCancelledStatus();
            orderToCancel.ClearDomainEvents();
            await cancelContext.SaveChangesAsync(ct);
            await cancelTransaction.CommitAsync(ct);
        });

        // Once the cancel commits, the payment reads Cancelled, so SetPaidStatus changes nothing.
        Assert.Equal(OrderStatus.Cancelled, await paymentLoaded.Task.WaitAsync(TimeSpan.FromSeconds(10), ct));
        await payment.WaitAsync(TimeSpan.FromSeconds(10), ct);

        using var readScope = _fixture.Services.CreateScope();
        var readContext = readScope.ServiceProvider.GetRequiredService<OrderingContext>();
        var stored = await readContext.Orders.AsNoTracking().SingleAsync(o => o.Id == orderId, ct);
        Assert.Equal(OrderStatus.Cancelled, stored.OrderStatus);
    }

    private async Task<int> CreateStockConfirmedOrderAsync(CancellationToken ct)
    {
        using var scope = _fixture.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<OrderingContext>();
        var order = new Order(
            "race-user",
            "race",
            new Address("15703 NE 61st Ct", "Redmond", "WA", "U.S.", "98052"),
            cardTypeId: 1,
            cardNumber: "4012888888881881",
            cardSecurityNumber: "123",
            cardHolderName: "race",
            cardExpiration: DateTime.UtcNow.AddYears(1));
        order.AddOrderItem(99, "Adventurer GPS Watch", 10.00m, 0m, "99.webp", 1);
        order.SetAwaitingValidationStatus();
        order.SetStockConfirmedStatus();
        order.ClearDomainEvents();
        context.Orders.Add(order);
        await context.SaveChangesAsync(ct);
        return order.Id;
    }
}
