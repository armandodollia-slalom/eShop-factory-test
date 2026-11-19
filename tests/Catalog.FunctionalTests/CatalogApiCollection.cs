namespace eShop.Catalog.FunctionalTests;

// One Catalog API host (Aspire app host with Postgres) for every test class in this project.
// Classes in one collection share the fixture and run one after another, so a count read by one class
// is not changed by another class running at the same time.
[CollectionDefinition(Name)]
public sealed class CatalogApiCollection : ICollectionFixture<CatalogApiFixture>
{
    public const string Name = "Catalog API";
}
