namespace eShop.Ordering.API.Application.Commands;

/// <summary>
/// Raised when an order does not exist or does not belong to the calling buyer.
/// Both cases are reported the same way so callers cannot probe for other buyers' orders.
/// </summary>
public sealed class OrderNotFoundException(int orderNumber)
    : Exception($"Order {orderNumber} was not found.")
{
}
