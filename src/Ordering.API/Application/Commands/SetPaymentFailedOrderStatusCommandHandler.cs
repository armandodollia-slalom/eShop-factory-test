namespace eShop.Ordering.API.Application.Commands;

// Regular CommandHandler
public class SetPaymentFailedOrderStatusCommandHandler : IRequestHandler<SetPaymentFailedOrderStatusCommand, bool>
{
    private readonly IOrderRepository _orderRepository;

    public SetPaymentFailedOrderStatusCommandHandler(IOrderRepository orderRepository)
    {
        _orderRepository = orderRepository;
    }

    /// <summary>
    /// Handler which processes the command when
    /// the payment service reports a failed payment.
    /// It runs on behalf of the system, so there is no caller whose ownership to check.
    /// </summary>
    /// <param name="command"></param>
    /// <returns></returns>
    public async Task<bool> Handle(SetPaymentFailedOrderStatusCommand command, CancellationToken cancellationToken)
    {
        var orderToUpdate = await _orderRepository.GetAsync(command.OrderNumber);
        if (orderToUpdate == null)
        {
            return false;
        }

        orderToUpdate.SetCancelledStatus();
        return await _orderRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);
    }
}
