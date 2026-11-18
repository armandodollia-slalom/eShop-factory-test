namespace eShop.Catalog.FunctionalTests;

// One CatalogApiFixture (app host and Postgres container) for every test class of this project. Classes in the
// collection run one after another; a test that changes the seeded catalog restores it before it returns.
[CollectionDefinition(Name)]
public sealed class CatalogApiCollection : ICollectionFixture<CatalogApiFixture>
{
    public const string Name = "Catalog API";
}
