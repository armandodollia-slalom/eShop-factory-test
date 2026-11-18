namespace eShop.Ordering.API.Application.Commands;

public record SetPaymentFailedOrderStatusCommand(int OrderNumber) : IRequest<bool>;
