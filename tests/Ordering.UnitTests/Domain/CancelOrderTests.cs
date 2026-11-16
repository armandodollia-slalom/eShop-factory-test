namespace eShop.Ordering.UnitTests.Domain;

using eShop.Ordering.Domain.AggregatesModel.OrderAggregate;

[TestClass]
[TestCategory("CANC-1")]
public class CancelOrderTests
{
    [TestMethod]
    [TestProperty("TestCase", "TC-CANC-1-05")]
    public void TC_CANC_1_05_SetPaidStatus_on_cancelled_order_leaves_it_cancelled()
    {
        // Order for buyer 1 with one item: ProductId 99, unit price 10.00, 1 unit.
        var order = new Order(
            "1",
            "fakeName",
            new AddressBuilder().Build(),
            cardTypeId: 5,
            cardNumber: "12",
            cardSecurityNumber: "123",
            cardHolderName: "name",
            cardExpiration: DateTime.UtcNow,
            buyerId: 1);
        order.AddOrderItem(99, "Adventurer GPS Watch", 10.00m, 0m, "99.webp", 1);
        order.SetAwaitingValidationStatus();
        order.SetStockConfirmedStatus();
        Assert.AreEqual(OrderStatus.StockConfirmed, order.OrderStatus);
        order.SetCancelledStatus();
        Assert.AreEqual(OrderStatus.Cancelled, order.OrderStatus);
        order.ClearDomainEvents();

        order.SetPaidStatus();

        Assert.AreEqual(OrderStatus.Cancelled, order.OrderStatus);
        Assert.IsFalse(order.DomainEvents?.OfType<OrderStatusChangedToPaidDomainEvent>().Any() ?? false);
    }
}
