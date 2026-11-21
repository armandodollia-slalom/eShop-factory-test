namespace eShop.Ordering.Infrastructure.Repositories;

public class OrderRepository
    : IOrderRepository
{
    private readonly OrderingContext _context;

    public IUnitOfWork UnitOfWork => _context;

    public OrderRepository(OrderingContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public Order Add(Order order)
    {
        return _context.Orders.Add(order).Entity;

    }

    public async Task<Order> GetAsync(int orderId)
    {
        // Every status change loads the order through here inside its command's transaction. Locking the row
        // makes concurrent status changes (cancel, grace period, stock, payment) run one after another, so each
        // reads the status the previous one committed instead of overwriting it with a stale copy.
        await _context.Database.ExecuteSqlAsync(
            $"""SELECT 1 FROM ordering.orders WHERE "Id" = {orderId} FOR UPDATE""");

        var order = await _context.Orders.FindAsync(orderId);

        if (order != null)
        {
            await _context.Entry(order)
                .Collection(i => i.OrderItems).LoadAsync();
        }

        return order;
    }

    public void Update(Order order)
    {
        _context.Entry(order).State = EntityState.Modified;
    }
}
