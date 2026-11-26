namespace eShop.Basket.FunctionalTests;

/// <summary>
/// One Redis container for every test class of this project: classes join with <c>[Collection(RedisCollection.Name)]</c>
/// and take <see cref="RedisFixture"/> in their constructor.
/// </summary>
[CollectionDefinition(Name)]
public sealed class RedisCollection : ICollectionFixture<RedisFixture>
{
    public const string Name = "Redis";
}
