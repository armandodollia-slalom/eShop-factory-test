namespace eShop.Catalog.FunctionalTests;

// One Catalog API host (Aspire app host with Postgres) for every test class in this project.
// The classes also share catalog rows (item 1's price), so they must not run in parallel.
[CollectionDefinition(Name)]
public sealed class CatalogApiCollection : ICollectionFixture<CatalogApiFixture>
{
    public const string Name = "Catalog API";
}
