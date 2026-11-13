namespace eShop.Ordering.UnitTests.Application;

using eShop.Ordering.API.Application.Queries;
using Microsoft.AspNetCore.Http.HttpResults;
using NSubstitute.ExceptionExtensions;
using Order = eShop.Ordering.API.Application.Queries.Order;

[TestClass]
[TestCategory("BUG-10")]
public class OrderStatusChangeTests
{
    private readonly IMediator _mediator = Substitute.For<IMediator>();
    private readonly IOrderQueries _queries = Substitute.For<IOrderQueries>();
    private readonly IIdentityService _identity = Substitute.For<IIdentityService>();
    private readonly ILogger<OrderServices> _logger = Substitute.For<ILogger<OrderServices>>();

    private OrderServices Services() => new(_mediator, _queries, _identity, _logger);

    private void OrderExists() => _queries.GetOrderAsync(5).Returns(Task.FromResult(new Order()));

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-10-11")]
    public async Task TC_BUG_10_11_CancelMapsDomainExceptionToConflict()
    {
        const string message = "Is not possible to change the order status from Shipped to Cancelled.";
        OrderExists();
#pragma warning disable NS5003
        _mediator.Send(Arg.Any<IdentifiedCommand<CancelOrderCommand, bool>>(), Arg.Any<CancellationToken>())
            .Throws(new OrderingDomainException(message));
#pragma warning restore NS5003

        var result = await OrdersApi.CancelOrderAsync(Guid.NewGuid(), new CancelOrderCommand(5), Services());

        var conflict = Assert.IsInstanceOfType<Conflict<ProblemDetails>>(result.Result);
        Assert.AreEqual(409, conflict.StatusCode);
        Assert.AreEqual("Invalid order status change", conflict.Value.Title);
        Assert.AreEqual(message, conflict.Value.Detail);
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-10-12")]
    public async Task TC_BUG_10_12_ShipMapsDomainExceptionToConflict()
    {
        const string message = "Is not possible to change the order status from Submitted to Shipped.";
        OrderExists();
#pragma warning disable NS5003
        _mediator.Send(Arg.Any<IdentifiedCommand<ShipOrderCommand, bool>>(), Arg.Any<CancellationToken>())
            .Throws(new OrderingDomainException(message));
#pragma warning restore NS5003

        var result = await OrdersApi.ShipOrderAsync(Guid.NewGuid(), new ShipOrderCommand(5), Services());

        var conflict = Assert.IsInstanceOfType<Conflict<ProblemDetails>>(result.Result);
        Assert.AreEqual(409, conflict.StatusCode);
        Assert.AreEqual(message, conflict.Value.Detail);
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-10-13")]
    public async Task TC_BUG_10_13_MissingOrderReturnsNotFoundWithoutSendingCommand()
    {
#pragma warning disable NS5003
        _queries.GetOrderAsync(5).Throws(new KeyNotFoundException());
#pragma warning restore NS5003

        var cancel = await OrdersApi.CancelOrderAsync(Guid.NewGuid(), new CancelOrderCommand(5), Services());
        var ship = await OrdersApi.ShipOrderAsync(Guid.NewGuid(), new ShipOrderCommand(5), Services());

        var cancelNotFound = Assert.IsInstanceOfType<NotFound<ProblemDetails>>(cancel.Result);
        var shipNotFound = Assert.IsInstanceOfType<NotFound<ProblemDetails>>(ship.Result);
        Assert.AreEqual("Order 5 was not found.", cancelNotFound.Value.Detail);
        Assert.AreEqual("Order 5 was not found.", shipNotFound.Value.Detail);
        await _mediator.DidNotReceiveWithAnyArgs().Send(default(IRequest<bool>), default);
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-10-14")]
    public async Task TC_BUG_10_14_FalseCommandResultStillReturns500()
    {
        OrderExists();
        _mediator.Send(Arg.Any<IdentifiedCommand<CancelOrderCommand, bool>>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(false));
        _mediator.Send(Arg.Any<IdentifiedCommand<ShipOrderCommand, bool>>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(false));

        var cancel = await OrdersApi.CancelOrderAsync(Guid.NewGuid(), new CancelOrderCommand(5), Services());
        var ship = await OrdersApi.ShipOrderAsync(Guid.NewGuid(), new ShipOrderCommand(5), Services());

        var cancelProblem = Assert.IsInstanceOfType<ProblemHttpResult>(cancel.Result);
        var shipProblem = Assert.IsInstanceOfType<ProblemHttpResult>(ship.Result);
        Assert.AreEqual(500, cancelProblem.StatusCode);
        Assert.AreEqual("Cancel order failed to process.", cancelProblem.ProblemDetails.Detail);
        Assert.AreEqual(500, shipProblem.StatusCode);
        Assert.AreEqual("Ship order failed to process.", shipProblem.ProblemDetails.Detail);
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-10-15")]
    public async Task TC_BUG_10_15_HandlerRethrowsOrderingDomainException()
    {
        var requestManager = Substitute.For<IRequestManager>();
        requestManager.ExistAsync(Arg.Any<Guid>()).Returns(Task.FromResult(false));
        var mediator = Substitute.For<IMediator>();
#pragma warning disable NS5003
        mediator.Send(Arg.Any<IRequest<bool>>(), Arg.Any<CancellationToken>()).Throws(new OrderingDomainException("x"));
#pragma warning restore NS5003
        var handler = new CancelOrderIdentifiedCommandHandler(mediator, requestManager,
            Substitute.For<ILogger<IdentifiedCommandHandler<CancelOrderCommand, bool>>>());

        var ex = await Assert.ThrowsExactlyAsync<OrderingDomainException>(() =>
            handler.Handle(new IdentifiedCommand<CancelOrderCommand, bool>(new CancelOrderCommand(5), Guid.NewGuid()), CancellationToken.None));

        Assert.AreEqual("x", ex.Message);
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-10-16")]
    public async Task TC_BUG_10_16_HandlerReturnsDefaultForOtherExceptions()
    {
        var requestManager = Substitute.For<IRequestManager>();
        requestManager.ExistAsync(Arg.Any<Guid>()).Returns(Task.FromResult(false));
        var mediator = Substitute.For<IMediator>();
#pragma warning disable NS5003
        mediator.Send(Arg.Any<IRequest<bool>>(), Arg.Any<CancellationToken>()).Throws(new InvalidOperationException("boom"));
#pragma warning restore NS5003
        var handler = new CancelOrderIdentifiedCommandHandler(mediator, requestManager,
            Substitute.For<ILogger<IdentifiedCommandHandler<CancelOrderCommand, bool>>>());

        var result = await handler.Handle(new IdentifiedCommand<CancelOrderCommand, bool>(new CancelOrderCommand(5), Guid.NewGuid()), CancellationToken.None);

        Assert.IsFalse(result);
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-10-17")]
    public async Task TC_BUG_10_17_CreateOrderStillReturnsOkOnDomainException()
    {
#pragma warning disable NS5003
        _mediator.Send(Arg.Any<IdentifiedCommand<CreateOrderCommand, bool>>(), Arg.Any<CancellationToken>())
            .Throws(new OrderingDomainException("rejected"));
#pragma warning restore NS5003
        var request = new CreateOrderRequest("user", "name", "city", "street", "state", "country", "zip",
            "4111111111111111", "Holder", DateTime.UtcNow.AddYears(1), "123", 1, null, new List<BasketItem>());

        var result = await OrdersApi.CreateOrderAsync(Guid.NewGuid(), request, Services());

        Assert.IsInstanceOfType<Ok>(result.Result);
    }
}
