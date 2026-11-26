namespace eShop.Ordering.UnitTests.Application;

using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Http.HttpResults;

[TestClass]
[TestCategory("BUG-10")]
public class Bug10OrderStatusChangeTests
{
    private readonly IMediator _mediator = Substitute.For<IMediator>();
    private readonly IRequestManager _requestManager = Substitute.For<IRequestManager>();

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-10-16")]
    public async Task TC_BUG_10_16_OrdersApiMapsRuleViolationTo409AndValidationTo400()
    {
        var ruleViolation = new OrderingDomainException("rule");
        var validation = new OrderingDomainException(
            "x",
            new ValidationException("Validation exception", new[] { new ValidationFailure("OrderNumber", "bad input") }));

        foreach (var (exception, status, detail) in new[] { (ruleViolation, 409, "rule"), (validation, 400, "bad input") })
        {
            var mediator = Substitute.For<IMediator>();
            mediator.Send(Arg.Any<IdentifiedCommand<CancelOrderCommand, bool>>(), default)
                .Returns(Task.FromException<bool>(exception));
            mediator.Send(Arg.Any<IdentifiedCommand<ShipOrderCommand, bool>>(), default)
                .Returns(Task.FromException<bool>(exception));
            var services = new OrderServices(
                mediator,
                Substitute.For<eShop.Ordering.API.Application.Queries.IOrderQueries>(),
                Substitute.For<IIdentityService>(),
                Substitute.For<ILogger<OrderServices>>());

            var cancel = await OrdersApi.CancelOrderAsync(Guid.NewGuid(), new CancelOrderCommand(1), services);
            var ship = await OrdersApi.ShipOrderAsync(Guid.NewGuid(), new ShipOrderCommand(1), services);

            var cancelProblem = Assert.IsInstanceOfType<ProblemHttpResult>(cancel.Result);
            Assert.AreEqual(status, cancelProblem.StatusCode);
            Assert.AreEqual(detail, cancelProblem.ProblemDetails.Detail);

            var shipProblem = Assert.IsInstanceOfType<ProblemHttpResult>(ship.Result);
            Assert.AreEqual(status, shipProblem.StatusCode);
            Assert.AreEqual(detail, shipProblem.ProblemDetails.Detail);
        }
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-10-17")]
    public async Task TC_BUG_10_17_IdentifiedHandlerRethrowsRuleViolationOnlyForOptedInHandlers()
    {
        var domainException = new OrderingDomainException("rule");
        _requestManager.ExistAsync(Arg.Any<Guid>()).Returns(Task.FromResult(false));
        _mediator.Send(Arg.Any<IRequest<bool>>(), default).Returns(Task.FromException<bool>(domainException));

        // Opted in (cancel, ReportsFailuresToCaller is true): the exception reaches the caller, the id is not recorded.
        var cancelHandler = new CancelOrderIdentifiedCommandHandler(
            _mediator,
            _requestManager,
            Substitute.For<ILogger<IdentifiedCommandHandler<CancelOrderCommand, bool>>>());
        var cancelCommand = new IdentifiedCommand<CancelOrderCommand, bool>(new CancelOrderCommand(1), Guid.NewGuid());

        var thrown = await Assert.ThrowsExactlyAsync<OrderingDomainException>(
            () => cancelHandler.Handle(cancelCommand, CancellationToken.None));
        Assert.AreSame(domainException, thrown);
        await _requestManager.DidNotReceive().CreateRequestForCommandAsync<CancelOrderCommand>(Arg.Any<Guid>());

        // Not opted in (create order): the exception is swallowed and the default result returned.
        var createHandler = new CreateOrderIdentifiedCommandHandler(
            _mediator,
            _requestManager,
            Substitute.For<ILogger<IdentifiedCommandHandler<CreateOrderCommand, bool>>>());
        var createCommand = new IdentifiedCommand<CreateOrderCommand, bool>(FakeCreateOrder(), Guid.NewGuid());

        var result = await createHandler.Handle(createCommand, CancellationToken.None);

        Assert.IsFalse(result);
    }

    private static CreateOrderCommand FakeCreateOrder() =>
        new(
            new List<BasketItem>(),
            userId: null,
            userName: null,
            city: null,
            street: null,
            state: null,
            country: null,
            zipcode: null,
            cardNumber: "1234",
            cardExpiration: DateTime.MinValue,
            cardSecurityNumber: "123",
            cardHolderName: "XXX",
            cardTypeId: 0);
}
