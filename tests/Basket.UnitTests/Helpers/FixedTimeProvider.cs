namespace eShop.Basket.UnitTests.Helpers;

/// <summary>A clock that reads the time the test set, so a test can place two updates on different days.</summary>
public sealed class FixedTimeProvider(DateTimeOffset utcNow) : TimeProvider
{
    public DateTimeOffset UtcNow { get; set; } = utcNow;

    public override DateTimeOffset GetUtcNow() => UtcNow;
}
