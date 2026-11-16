using eShop.Ordering.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace eShop.Ordering.UnitTests.Infrastructure;

[TestClass]
public class RequestManagerTest
{
    [TestMethod]
    public async Task CreateRequestForCommandAsync_maps_unique_violation_to_domain_exception_and_detaches_request()
    {
        // Arrange
        var id = Guid.NewGuid();
        using var context = new UniqueViolationOrderingContext();
        var requestManager = new RequestManager(context);

        // Act
        var exception = await Assert.ThrowsExactlyAsync<OrderingDomainException>(
            () => requestManager.CreateRequestForCommandAsync<CreateOrderCommand>(id));

        // Assert
        Assert.AreEqual($"Request with {id} already exists", exception.Message);
        Assert.IsEmpty(context.ChangeTracker.Entries<ClientRequest>());
    }

    /// <summary>
    /// An ordering context whose store reports no existing request and rejects the insert with a
    /// PostgreSQL unique violation, as when a concurrent request with the same id was saved first.
    /// </summary>
    private sealed class UniqueViolationOrderingContext() : OrderingContext(
        new DbContextOptionsBuilder<OrderingContext>().UseNpgsql("Host=unused").Options)
    {
        public override ValueTask<TEntity> FindAsync<TEntity>(params object[] keyValues) where TEntity : class =>
            ValueTask.FromResult<TEntity>(null);

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
            throw new DbUpdateException(
                "An error occurred while saving the entity changes.",
                new PostgresException("duplicate key value violates unique constraint", "ERROR", "ERROR", PostgresErrorCodes.UniqueViolation));
    }
}
