namespace eShop.Ordering.FunctionalTests;

[CollectionDefinition(Name)]
public sealed class OrderingApiCollection : ICollectionFixture<OrderingApiFixture>
{
    public const string Name = "OrderingApi";
}
