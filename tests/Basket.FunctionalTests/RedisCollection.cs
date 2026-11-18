namespace eShop.Basket.FunctionalTests;

/// <summary>Every Redis test class shares one <see cref="RedisFixture"/>, so the project starts Redis once.</summary>
[CollectionDefinition(Name)]
public sealed class RedisCollection : ICollectionFixture<RedisFixture>
{
    public const string Name = "Redis";
}
