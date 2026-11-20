namespace eShop.Catalog.FunctionalTests;

// One CatalogApiFixture (Aspire app host and Postgres container) shared by every test class of the project.
[CollectionDefinition(Name)]
public sealed class CatalogApiCollection : ICollectionFixture<CatalogApiFixture>
{
    public const string Name = "CatalogApi";
}
