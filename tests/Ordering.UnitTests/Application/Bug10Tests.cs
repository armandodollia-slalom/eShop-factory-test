namespace eShop.Ordering.UnitTests.Application;

using eShop.Ordering.API.Application.Queries;
using Microsoft.AspNetCore.Http.HttpResults;
using Order = eShop.Ordering.API.Application.Queries.Order;

[TestClass]
[TestCategory("BUG-10")]
public class Bug10Tests
{
    private readonly IMediator _mediator = Substitute.For<IMediator>();
    private readonly IOrderQueries _orderQueries = Substitute.For<IOrderQueries>();
    private readonly IIdentityService _identityService = Substitute.For<IIdentityService>();
    private readonly ILogger<OrderServices> _servicesLogger = Substitute.For<ILogger<OrderServices>>();

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-10-13")]
    public async Task TC_BUG_10_13_IdentifiedCommandHandler_rethrows_domain_exceptions_only()
    {
        var requestManager = Substitute.For<IRequestManager>();
        requestManager.ExistAsync(Arg.Any<Guid>()).Returns(Task.FromResult(false));
        var logger = Substitute.For<ILogger<IdentifiedCommandHandler<CancelOrderCommand, bool>>>();
        var handler = new CancelOrderIdentifiedCommandHandler(_mediator, requestManager, logger);
        var message = new IdentifiedCommand<CancelOrderCommand, bool>(new CancelOrderCommand(1), Guid.NewGuid());

        // Case A: a domain exception escapes Handle unchanged
        var domainException = new OrderingDomainException("Is not possible to change the order status from Shipped to Cancelled.");
        _mediator.Send(Arg.Any<IRequest<bool>>(), Arg.Any<CancellationToken>())
            .Returns<Task<bool>>(_ => throw domainException);

        var thrown = await Assert.ThrowsExactlyAsync<OrderingDomainException>(
            () => handler.Handle(message, CancellationToken.None));
        Assert.AreSame(domainException, thrown);

        // Case B: any other exception is swallowed and the default result (false) is returned
        _mediator.Send(Arg.Any<IRequest<bool>>(), Arg.Any<CancellationToken>())
            .Returns<Task<bool>>(_ => throw new InvalidOperationException("boom"));

        var result = await handler.Handle(message, CancellationToken.None);
        Assert.IsFalse(result);
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-10-14")]
    public async Task TC_BUG_10_14_False_result_for_existing_order_stays_500_problem()
    {
        _mediator.Send(Arg.Any<IdentifiedCommand<CancelOrderCommand, bool>>(), default).Returns(Task.FromResult(false));
        _mediator.Send(Arg.Any<IdentifiedCommand<ShipOrderCommand, bool>>(), default).Returns(Task.FromResult(false));
        _orderQueries.GetOrderAsync(Arg.Any<int>()).Returns(Task.FromResult(new Order()));
        var services = new OrderServices(_mediator, _orderQueries, _identityService, _servicesLogger);

        var cancel = await OrdersApi.CancelOrderAsync(Guid.NewGuid(), new CancelOrderCommand(1), services);
        var cancelProblem = Assert.IsInstanceOfType<ProblemHttpResult>(cancel.Result);
        Assert.AreEqual(500, cancelProblem.StatusCode);
        Assert.AreEqual("Cancel order failed to process.", cancelProblem.ProblemDetails.Detail);

        var ship = await OrdersApi.ShipOrderAsync(Guid.NewGuid(), new ShipOrderCommand(1), services);
        var shipProblem = Assert.IsInstanceOfType<ProblemHttpResult>(ship.Result);
        Assert.AreEqual(500, shipProblem.StatusCode);
        Assert.AreEqual("Ship order failed to process.", shipProblem.ProblemDetails.Detail);
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-10-15")]
    public async Task TC_BUG_10_15_Create_order_still_returns_ok_on_domain_exception()
    {
        _mediator.Send(Arg.Any<IdentifiedCommand<CreateOrderCommand, bool>>(), default)
            .Returns<Task<bool>>(_ => throw new OrderingDomainException("rule violated"));
        var services = new OrderServices(_mediator, _orderQueries, _identityService, _servicesLogger);
        var request = new CreateOrderRequest(
            "user-1", "alice", "Seattle", "1 Main St", "WA", "USA", "98101",
            "XXXXXXXXXXXX0005", "Alice Smith", DateTime.UtcNow.AddYears(1), "123", 1, "alice",
            new List<BasketItem> { new() { Id = "1", ProductId = 12, ProductName = "Test", UnitPrice = 10, OldUnitPrice = 9, Quantity = 1 } });

        var result = await OrdersApi.CreateOrderAsync(Guid.NewGuid(), request, services);

        Assert.IsInstanceOfType<Ok>(result.Result);
        // the exception is logged (as a warning) rather than thrown
        Assert.IsTrue(_servicesLogger.ReceivedCalls().Any(c =>
            c.GetMethodInfo().Name == nameof(ILogger.Log)
            && c.GetArguments().Length > 3
            && c.GetArguments()[3] is OrderingDomainException));
    }
}
