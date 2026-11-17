namespace eShop.Catalog.FunctionalTests;

// One Catalog API host and Postgres container for every test class of this project.
[CollectionDefinition(Name)]
public sealed class CatalogApiCollection : ICollectionFixture<CatalogApiFixture>
{
    public const string Name = "Catalog API";
}
