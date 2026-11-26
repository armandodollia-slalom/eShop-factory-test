namespace eShop.Ordering.UnitTests.Application;

using eShop.Ordering.Domain.AggregatesModel.OrderAggregate;
using eShop.Ordering.Domain.Seedwork;
using eShop.Ordering.UnitTests.Domain;

[TestClass]
[TestCategory("CANC-1")]
public class CancelOrderCommandHandlerTest
{
    private const string BobIdentity = "bob-identity";

    private readonly IOrderRepository _orderRepository;
    private readonly IBuyerRepository _buyerRepository;
    private readonly IRequestManager _requestManager;
    private readonly IMediator _mediator;
    private readonly IUnitOfWork _unitOfWork;

    public CancelOrderCommandHandlerTest()
    {
        _orderRepository = Substitute.For<IOrderRepository>();
        _buyerRepository = Substitute.For<IBuyerRepository>();
        _requestManager = Substitute.For<IRequestManager>();
        _mediator = Substitute.For<IMediator>();
        _unitOfWork = Substitute.For<IUnitOfWork>();
        _orderRepository.UnitOfWork.Returns(_unitOfWork);

        // Bob's buyer record has Id 0 (a new Buyer); orders with another buyer id belong to someone else.
        _buyerRepository.FindAsync(BobIdentity).Returns(new Buyer(BobIdentity, "bob"));

        // The identified handler hands the command to the real cancel handler.
        var cancelHandler = new CancelOrderCommandHandler(_orderRepository, _buyerRepository);
        _mediator.Send(Arg.Any<CancelOrderCommand>(), Arg.Any<CancellationToken>())
            .Returns(call => cancelHandler.Handle(call.Arg<CancelOrderCommand>(), CancellationToken.None));
    }

    [TestMethod]
    public async Task Repeated_request_id_against_another_buyers_order_is_refused()
    {
        // Alice's order (buyer 1) is still Submitted; bob reuses a request id he already used for his own cancel.
        var alicesOrder = SubmittedOrder(buyerId: 1);
        _orderRepository.GetAsync(7).Returns(alicesOrder);
        var requestId = Guid.NewGuid();
        _requestManager.ExistAsync(requestId).Returns(true);

        var handler = new CancelOrderIdentifiedCommandHandler(
            _mediator, _requestManager, Substitute.For<ILogger<CancelOrderIdentifiedCommandHandler>>());
        var result = await handler.Handle(
            new IdentifiedCommand<CancelOrderCommand, CancelOrderResult>(
                new CancelOrderCommand(7) { BuyerIdentityGuid = BobIdentity }, requestId),
            CancellationToken.None);

        Assert.AreEqual(CancelOrderResult.NotFound, result);
        Assert.AreEqual(OrderStatus.Submitted, alicesOrder.OrderStatus);
        await _unitOfWork.DidNotReceive().SaveEntitiesAsync(Arg.Any<CancellationToken>());
        await _requestManager.DidNotReceive().CreateRequestForCommandAsync<CancelOrderCommand>(Arg.Any<Guid>());
    }

    [TestMethod]
    public async Task Repeated_request_id_for_own_cancelled_order_answers_cancelled_without_recording_again()
    {
        var order = SubmittedOrder(buyerId: 0);
        order.SetCancelledStatus();
        order.ClearDomainEvents();
        _orderRepository.GetAsync(8).Returns(order);
        var requestId = Guid.NewGuid();
        _requestManager.ExistAsync(requestId).Returns(true);

        var handler = new CancelOrderIdentifiedCommandHandler(
            _mediator, _requestManager, Substitute.For<ILogger<CancelOrderIdentifiedCommandHandler>>());
        var result = await handler.Handle(
            new IdentifiedCommand<CancelOrderCommand, CancelOrderResult>(
                new CancelOrderCommand(8) { BuyerIdentityGuid = BobIdentity }, requestId),
            CancellationToken.None);

        Assert.AreEqual(CancelOrderResult.Cancelled, result);
        await _requestManager.DidNotReceive().CreateRequestForCommandAsync<CancelOrderCommand>(Arg.Any<Guid>());
    }

    [TestMethod]
    public async Task Cancelling_an_already_cancelled_order_saves_nothing_and_raises_no_event()
    {
        var order = SubmittedOrder(buyerId: 0);
        order.SetCancelledStatus();
        order.ClearDomainEvents();
        _orderRepository.GetAsync(9).Returns(order);

        var handler = new CancelOrderCommandHandler(_orderRepository, _buyerRepository);
        var result = await handler.Handle(
            new CancelOrderCommand(9) { BuyerIdentityGuid = BobIdentity }, CancellationToken.None);

        Assert.AreEqual(CancelOrderResult.Cancelled, result);
        Assert.AreEqual(OrderStatus.Cancelled, order.OrderStatus);
        Assert.IsFalse(order.DomainEvents?.OfType<OrderCancelledDomainEvent>().Any() ?? false);
        await _unitOfWork.DidNotReceive().SaveEntitiesAsync(Arg.Any<CancellationToken>());
    }

    [TestMethod]
    public async Task Cancelling_own_submitted_order_saves_and_records_the_request()
    {
        var order = SubmittedOrder(buyerId: 0);
        _orderRepository.GetAsync(10).Returns(order);
        var requestId = Guid.NewGuid();
        _requestManager.ExistAsync(requestId).Returns(false);

        var handler = new CancelOrderIdentifiedCommandHandler(
            _mediator, _requestManager, Substitute.For<ILogger<CancelOrderIdentifiedCommandHandler>>());
        var result = await handler.Handle(
            new IdentifiedCommand<CancelOrderCommand, CancelOrderResult>(
                new CancelOrderCommand(10) { BuyerIdentityGuid = BobIdentity }, requestId),
            CancellationToken.None);

        Assert.AreEqual(CancelOrderResult.Cancelled, result);
        Assert.AreEqual(OrderStatus.Cancelled, order.OrderStatus);
        await _unitOfWork.Received(1).SaveEntitiesAsync(Arg.Any<CancellationToken>());
        await _requestManager.Received(1).CreateRequestForCommandAsync<CancelOrderCommand>(requestId);
    }

    private static Order SubmittedOrder(int buyerId)
        => new(
            "1",
            "fakeName",
            new AddressBuilder().Build(),
            cardTypeId: 5,
            cardNumber: "12",
            cardSecurityNumber: "123",
            cardHolderName: "name",
            cardExpiration: DateTime.UtcNow,
            buyerId: buyerId);
}
