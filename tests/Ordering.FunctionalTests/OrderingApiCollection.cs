namespace eShop.Ordering.FunctionalTests;

/// <summary>One <see cref="OrderingApiFixture"/> (app host, databases) shared by every test class of the project.</summary>
[CollectionDefinition(Name)]
public sealed class OrderingApiCollection : ICollectionFixture<OrderingApiFixture>
{
    public const string Name = "Ordering API";
}
