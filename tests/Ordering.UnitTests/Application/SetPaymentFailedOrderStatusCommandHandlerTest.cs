using eShop.Ordering.API.Application.IntegrationEvents.EventHandling;
using eShop.Ordering.API.Application.IntegrationEvents.Events;
using eShop.Ordering.Domain.AggregatesModel.OrderAggregate;
using eShop.Ordering.UnitTests.Domain;

namespace eShop.Ordering.UnitTests.Application;

[TestClass]
public class SetPaymentFailedOrderStatusCommandHandlerTest
{
    private readonly IOrderRepository _orderRepositoryMock;

    public SetPaymentFailedOrderStatusCommandHandlerTest()
    {
        _orderRepositoryMock = Substitute.For<IOrderRepository>();
    }

    [TestMethod]
    public async Task Payment_failed_event_sends_SetPaymentFailedOrderStatusCommand_with_the_event_order_id()
    {
        var mediator = Substitute.For<IMediator>();
        var logger = Substitute.For<ILogger<OrderPaymentFailedIntegrationEventHandler>>();
        var eventHandler = new OrderPaymentFailedIntegrationEventHandler(mediator, logger);

        await eventHandler.Handle(new OrderPaymentFailedIntegrationEvent(42));

        await mediator.Received(1).Send(
            Arg.Is<SetPaymentFailedOrderStatusCommand>(c => c.OrderNumber == 42),
            Arg.Any<CancellationToken>());
        await mediator.DidNotReceive().Send(Arg.Any<CancelOrderCommand>(), Arg.Any<CancellationToken>());
    }

    [TestMethod]
    public async Task Handle_cancels_a_submitted_order_and_saves_without_any_caller_identity()
    {
        var order = new OrderBuilder(new AddressBuilder().Build()).Build();
        _orderRepositoryMock.GetAsync(7).Returns(Task.FromResult(order));
        _orderRepositoryMock.UnitOfWork.SaveEntitiesAsync(Arg.Any<CancellationToken>()).Returns(Task.FromResult(true));
        var handler = new SetPaymentFailedOrderStatusCommandHandler(_orderRepositoryMock);

        var result = await handler.Handle(new SetPaymentFailedOrderStatusCommand(7), CancellationToken.None);

        Assert.IsTrue(result);
        Assert.AreEqual(OrderStatus.Cancelled, order.OrderStatus);
        await _orderRepositoryMock.UnitOfWork.Received(1).SaveEntitiesAsync(Arg.Any<CancellationToken>());
    }

    [TestMethod]
    public async Task Handle_returns_false_and_saves_nothing_for_a_missing_order()
    {
        _orderRepositoryMock.GetAsync(Arg.Any<int>()).Returns(Task.FromResult<Order>(null));
        var handler = new SetPaymentFailedOrderStatusCommandHandler(_orderRepositoryMock);

        var result = await handler.Handle(new SetPaymentFailedOrderStatusCommand(99), CancellationToken.None);

        Assert.IsFalse(result);
        await _orderRepositoryMock.UnitOfWork.DidNotReceive().SaveEntitiesAsync(Arg.Any<CancellationToken>());
    }
}
