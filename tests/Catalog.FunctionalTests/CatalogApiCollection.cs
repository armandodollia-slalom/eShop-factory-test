namespace eShop.Catalog.FunctionalTests;

// One Catalog API host (Aspire app host with Postgres) for every test class in this project.
// Two IClassFixture<CatalogApiFixture> classes started two hosts in parallel and their start-up timed out.
[CollectionDefinition(Name)]
public sealed class CatalogApiCollection : ICollectionFixture<CatalogApiFixture>
{
    public const string Name = "Catalog API";
}
