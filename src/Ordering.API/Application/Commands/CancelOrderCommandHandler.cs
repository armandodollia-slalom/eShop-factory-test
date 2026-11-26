namespace eShop.Ordering.API.Application.Commands;

// Regular CommandHandler
public class CancelOrderCommandHandler : IRequestHandler<CancelOrderCommand, CancelOrderResult>
{
    private readonly IOrderRepository _orderRepository;
    private readonly IBuyerRepository _buyerRepository;

    public CancelOrderCommandHandler(IOrderRepository orderRepository, IBuyerRepository buyerRepository)
    {
        _orderRepository = orderRepository;
        _buyerRepository = buyerRepository;
    }

    /// <summary>
    /// Handler which processes the command when
    /// customer executes cancel order from app
    /// </summary>
    /// <param name="command"></param>
    /// <returns></returns>
    public async Task<CancelOrderResult> Handle(CancelOrderCommand command, CancellationToken cancellationToken)
    {
        // The repository locks the order's row, so a concurrent status change cannot overwrite the cancel.
        var orderToUpdate = await _orderRepository.GetAsync(command.OrderNumber);
        if (orderToUpdate == null)
        {
            return CancelOrderResult.NotFound;
        }

        // A buyer may only cancel their own orders; someone else's order is reported as not found.
        if (command.BuyerIdentityGuid != null)
        {
            var buyer = await _buyerRepository.FindAsync(command.BuyerIdentityGuid);
            if (buyer == null || orderToUpdate.BuyerId != buyer.Id)
            {
                return CancelOrderResult.NotFound;
            }
        }

        // Cancelling an order that is already cancelled changes nothing, so it saves nothing and raises no event.
        if (orderToUpdate.OrderStatus == OrderStatus.Cancelled)
        {
            return CancelOrderResult.Cancelled;
        }

        try
        {
            orderToUpdate.SetCancelledStatus();
        }
        catch (OrderingDomainException)
        {
            return CancelOrderResult.NotCancellable;
        }

        await _orderRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);
        return CancelOrderResult.Cancelled;
    }
}


// Use for Idempotency in Command process.
// Unlike IdentifiedCommandHandler, the request is recorded only once the order is cancelled, so a refused
// cancel leaves nothing committed, and unexpected failures are not swallowed: they roll the transaction back.
// A repeated request id runs the command again instead of answering from the record: the record is shared by
// every command and buyer, so only the command's ownership check can tell whether the caller may cancel this
// order. Cancelling is idempotent (an already cancelled order is left untouched), so the repeat changes nothing.
public class CancelOrderIdentifiedCommandHandler : IRequestHandler<IdentifiedCommand<CancelOrderCommand, CancelOrderResult>, CancelOrderResult>
{
    private readonly IMediator _mediator;
    private readonly IRequestManager _requestManager;
    private readonly ILogger<CancelOrderIdentifiedCommandHandler> _logger;

    public CancelOrderIdentifiedCommandHandler(
        IMediator mediator,
        IRequestManager requestManager,
        ILogger<CancelOrderIdentifiedCommandHandler> logger)
    {
        ArgumentNullException.ThrowIfNull(logger);
        _mediator = mediator;
        _requestManager = requestManager;
        _logger = logger;
    }

    public async Task<CancelOrderResult> Handle(IdentifiedCommand<CancelOrderCommand, CancelOrderResult> message, CancellationToken cancellationToken)
    {
        var command = message.Command;
        var commandName = command.GetGenericTypeName();

        _logger.LogInformation(
            "Sending command: {CommandName} - {IdProperty}: {CommandId} ({@Command})",
            commandName,
            nameof(command.OrderNumber),
            command.OrderNumber,
            command);

        var result = await _mediator.Send(command, cancellationToken);

        _logger.LogInformation(
            "Command result: {@Result} - {CommandName} - {IdProperty}: {CommandId} ({@Command})",
            result,
            commandName,
            nameof(command.OrderNumber),
            command.OrderNumber,
            command);

        if (result == CancelOrderResult.Cancelled && !await _requestManager.ExistAsync(message.Id))
        {
            await _requestManager.CreateRequestForCommandAsync<CancelOrderCommand>(message.Id);
        }

        return result;
    }
}
