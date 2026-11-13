namespace eShop.Ordering.UnitTests.Application;

using eShop.Ordering.API.Application.Queries;
using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using NSubstitute.ExceptionExtensions;

[TestClass]
[TestCategory("BUG-10")]
public class OrderStatusChangeTests
{
    private const string Rule = "Is not possible to change the order status from Shipped to Cancelled.";

    private readonly IMediator _mediator = Substitute.For<IMediator>();
    private readonly IRequestManager _requestManager = Substitute.For<IRequestManager>();
    private readonly IOrderQueries _queries = Substitute.For<IOrderQueries>();
    private readonly IIdentityService _identity = Substitute.For<IIdentityService>();
    private readonly ILogger<OrderServices> _servicesLogger = Substitute.For<ILogger<OrderServices>>();

    private OrderServices Services() => new(_mediator, _queries, _identity, _servicesLogger);

    private static int ErrorLogCount(ILogger logger) =>
        logger.ReceivedCalls().Count(c => c.GetMethodInfo().Name == "Log" && (LogLevel)c.GetArguments()[0]! == LogLevel.Error);

    private static int WarningLogCount(ILogger logger) =>
        logger.ReceivedCalls().Count(c => c.GetMethodInfo().Name == "Log" && (LogLevel)c.GetArguments()[0]! == LogLevel.Warning);

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-10-13")]
    public async Task TC_BUG_10_13_HandlerRethrowsNonDomainException()
    {
        var logger = Substitute.For<ILogger<IdentifiedCommandHandler<CancelOrderCommand, bool>>>();
        _requestManager.ExistAsync(Arg.Any<Guid>()).Returns(Task.FromResult(false));
        _mediator.Send(Arg.Any<IRequest<bool>>(), Arg.Any<CancellationToken>()).ThrowsAsync(new InvalidOperationException("db down"));
        var handler = new CancelOrderIdentifiedCommandHandler(_mediator, _requestManager, logger);
        var message = new IdentifiedCommand<CancelOrderCommand, bool>(new CancelOrderCommand(1), Guid.NewGuid());

        await Assert.ThrowsExactlyAsync<InvalidOperationException>(() => handler.Handle(message, CancellationToken.None));

        Assert.IsGreaterThanOrEqualTo(1, ErrorLogCount(logger), "an error-level entry was expected");
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-10-14")]
    public async Task TC_BUG_10_14_HandlerPassesDomainExceptionThrough()
    {
        var logger = Substitute.For<ILogger<IdentifiedCommandHandler<ShipOrderCommand, bool>>>();
        var expected = new OrderingDomainException("rule");
        _requestManager.ExistAsync(Arg.Any<Guid>()).Returns(Task.FromResult(false));
        _mediator.Send(Arg.Any<IRequest<bool>>(), Arg.Any<CancellationToken>()).ThrowsAsync(expected);
        var handler = new ShipOrderIdentifiedCommandHandler(_mediator, _requestManager, logger);
        var message = new IdentifiedCommand<ShipOrderCommand, bool>(new ShipOrderCommand(1), Guid.NewGuid());

        var actual = await Assert.ThrowsExactlyAsync<OrderingDomainException>(() => handler.Handle(message, CancellationToken.None));

        Assert.AreSame(expected, actual);
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-10-15")]
    public async Task TC_BUG_10_15_EndpointsMapDomainExceptionTo409()
    {
        _mediator.Send(Arg.Any<IdentifiedCommand<CancelOrderCommand, bool>>(), Arg.Any<CancellationToken>()).ThrowsAsync(new OrderingDomainException(Rule));
        _mediator.Send(Arg.Any<IdentifiedCommand<ShipOrderCommand, bool>>(), Arg.Any<CancellationToken>()).ThrowsAsync(new OrderingDomainException(Rule));

        var cancel = await OrdersApi.CancelOrderAsync(Guid.NewGuid(), new CancelOrderCommand(1), Services());
        var ship = await OrdersApi.ShipOrderAsync(Guid.NewGuid(), new ShipOrderCommand(1), Services());

        foreach (var result in new object[] { cancel.Result, ship.Result })
        {
            var problem = Assert.IsInstanceOfType<ProblemHttpResult>(result);
            Assert.AreEqual(409, problem.StatusCode);
            Assert.AreEqual(Rule, problem.ProblemDetails.Detail);
        }
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-10-16")]
    public async Task TC_BUG_10_16_WrappedValidationExceptionMapsTo400()
    {
        var wrapped = new OrderingDomainException("invalid command", new ValidationException("invalid command"));
        _mediator.Send(Arg.Any<IdentifiedCommand<CancelOrderCommand, bool>>(), Arg.Any<CancellationToken>()).ThrowsAsync(wrapped);
        _mediator.Send(Arg.Any<IdentifiedCommand<ShipOrderCommand, bool>>(), Arg.Any<CancellationToken>()).ThrowsAsync(wrapped);

        var cancel = await OrdersApi.CancelOrderAsync(Guid.NewGuid(), new CancelOrderCommand(1), Services());
        var ship = await OrdersApi.ShipOrderAsync(Guid.NewGuid(), new ShipOrderCommand(1), Services());

        foreach (var result in new object[] { cancel.Result, ship.Result })
        {
            var problem = Assert.IsInstanceOfType<ProblemHttpResult>(result);
            Assert.AreEqual(400, problem.StatusCode);
            Assert.AreEqual("invalid command", problem.ProblemDetails.Detail);
        }
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-10-17")]
    public async Task TC_BUG_10_17_FalseResultMapsTo404()
    {
        _mediator.Send(Arg.Any<IdentifiedCommand<CancelOrderCommand, bool>>(), Arg.Any<CancellationToken>()).Returns(Task.FromResult(false));
        _mediator.Send(Arg.Any<IdentifiedCommand<ShipOrderCommand, bool>>(), Arg.Any<CancellationToken>()).Returns(Task.FromResult(false));

        var cancel = await OrdersApi.CancelOrderAsync(Guid.NewGuid(), new CancelOrderCommand(1), Services());
        var ship = await OrdersApi.ShipOrderAsync(Guid.NewGuid(), new ShipOrderCommand(1), Services());

        foreach (var result in new object[] { cancel.Result, ship.Result })
        {
            var problem = Assert.IsInstanceOfType<ProblemHttpResult>(result);
            Assert.AreEqual(404, problem.StatusCode);
        }
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-10-18")]
    public async Task TC_BUG_10_18_CreateOrderUnchangedWhenCommandThrows()
    {
        _mediator.Send(Arg.Any<IdentifiedCommand<CreateOrderCommand, bool>>(), Arg.Any<CancellationToken>()).ThrowsAsync(new InvalidOperationException("boom"));
        var request = new CreateOrderRequest("1", "TestUser", null, null, null, null, null, "XXXXXXXXXXXX0005", "Test User",
            DateTime.UtcNow.AddYears(1), "123", 1, null, new List<BasketItem> { new() { Id = "1", ProductId = 12, ProductName = "Test", UnitPrice = 10, Quantity = 1 } });

        var result = await OrdersApi.CreateOrderAsync(Guid.NewGuid(), request, Services());

        Assert.IsInstanceOfType<Ok>(result.Result);
        Assert.IsGreaterThanOrEqualTo(1, ErrorLogCount(_servicesLogger), "an error-level entry was expected");
        Assert.IsGreaterThanOrEqualTo(1, WarningLogCount(_servicesLogger), "a warning-level entry was expected");
    }
}
