namespace eShop.Catalog.FunctionalTests;

// One Catalog API host (Aspire app host with Postgres) for every test class in this project.
// Tests in one collection run one at a time, so a test that creates or changes rows restores them before the next test reads.
[CollectionDefinition(Name)]
public sealed class CatalogApiCollection : ICollectionFixture<CatalogApiFixture>
{
    public const string Name = "Catalog API";
}
