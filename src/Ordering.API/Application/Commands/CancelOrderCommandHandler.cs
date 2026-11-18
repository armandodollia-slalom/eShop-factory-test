namespace eShop.Ordering.API.Application.Commands;

// Regular CommandHandler
public class CancelOrderCommandHandler : IRequestHandler<CancelOrderCommand, bool>
{
    private readonly IOrderRepository _orderRepository;
    private readonly IBuyerRepository _buyerRepository;
    private readonly IIdentityService _identityService;

    public CancelOrderCommandHandler(
        IOrderRepository orderRepository,
        IBuyerRepository buyerRepository,
        IIdentityService identityService)
    {
        _orderRepository = orderRepository;
        _buyerRepository = buyerRepository;
        _identityService = identityService;
    }

    /// <summary>
    /// Handler which processes the command when
    /// customer executes cancel order from app
    /// </summary>
    /// <param name="command"></param>
    /// <returns></returns>
    public async Task<bool> Handle(CancelOrderCommand command, CancellationToken cancellationToken)
    {
        var orderToUpdate = await _orderRepository.GetAsync(command.OrderNumber);
        var buyer = await _buyerRepository.FindAsync(_identityService.GetUserIdentity());

        // Thrown rather than returning false so the surrounding transaction rolls back the idempotency
        // request, and a missing order looks the same as another buyer's order.
        if (orderToUpdate == null || buyer == null || orderToUpdate.BuyerId != buyer.Id)
        {
            throw new OrderNotFoundException(command.OrderNumber);
        }

        orderToUpdate.SetCancelledStatus();
        return await _orderRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);
    }
}


// Use for Idempotency in Command process
public class CancelOrderIdentifiedCommandHandler : IdentifiedCommandHandler<CancelOrderCommand, bool>
{
    public CancelOrderIdentifiedCommandHandler(
        IMediator mediator,
        IRequestManager requestManager,
        ILogger<IdentifiedCommandHandler<CancelOrderCommand, bool>> logger)
        : base(mediator, requestManager, logger)
    {
    }

    protected override bool CreateResultForDuplicateRequest()
    {
        return true; // Ignore duplicate requests for processing order.
    }
}
