namespace eShop.Basket.FunctionalTests;

// One Redis and one Basket API host for every test class in this project. The tests of the collection run one
// after another, so a test may set the host's clock (BasketApiFixture.Clock) for its own calls.
[CollectionDefinition(Name)]
public sealed class BasketApiCollection : ICollectionFixture<BasketApiFixture>
{
    public const string Name = "Basket API";
}
