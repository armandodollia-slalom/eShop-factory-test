namespace eShop.Catalog.FunctionalTests;

// One Catalog API host (Aspire app host with Postgres) for every test class in this project.
// Two IClassFixture<CatalogApiFixture> classes would start two hosts in parallel, which fails on start-up.
// The tests share one database, so a test must not depend on rows other tests create, change or delete.
[CollectionDefinition(Name)]
public sealed class CatalogApiCollection : ICollectionFixture<CatalogApiFixture>
{
    public const string Name = "Catalog API";
}
