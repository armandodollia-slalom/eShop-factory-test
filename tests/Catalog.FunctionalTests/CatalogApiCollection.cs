namespace eShop.Catalog.FunctionalTests;

// Every test class of this project shares one CatalogApiFixture (one Postgres container and one app host),
// and the classes of one collection run one at a time against its database.
[CollectionDefinition(Name)]
public sealed class CatalogApiCollection : ICollectionFixture<CatalogApiFixture>
{
    public const string Name = "CatalogApi";
}
