using Npgsql;

namespace eShop.Ordering.Infrastructure.Idempotency;

public class RequestManager : IRequestManager
{
    private readonly OrderingContext _context;

    public RequestManager(OrderingContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }


    public async Task<bool> ExistAsync(Guid id)
    {
        var request = await _context.
            FindAsync<ClientRequest>(id);

        return request != null;
    }

    public async Task CreateRequestForCommandAsync<T>(Guid id)
    {
        var exists = await ExistAsync(id);

        var request = exists ?
            throw new OrderingDomainException($"Request with {id} already exists") :
            new ClientRequest()
            {
                Id = id,
                Name = typeof(T).Name,
                Time = DateTime.UtcNow
            };

        _context.Add(request);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            // A concurrent request with the same id was inserted first. Inside a transaction EF Core rolled
            // back to its savepoint; detach the entry so the commit does not try to insert it again.
            _context.Entry(request).State = EntityState.Detached;
            throw new OrderingDomainException($"Request with {id} already exists");
        }
    }
}
