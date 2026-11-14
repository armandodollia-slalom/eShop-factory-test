namespace eShop.WebAppComponents.Catalog;

public record CatalogItem(
    int Id,
    string Name,
    string Description,
    decimal Price,
    string PictureUrl,
    int CatalogBrandId,
    CatalogBrand CatalogBrand,
    int CatalogTypeId,
    CatalogItemType CatalogType,
    // Fails closed on purpose: an item whose stock is not reported is shown as out of stock and cannot be added to the bag.
    int AvailableStock = 0)
{
    public bool IsOutOfStock => AvailableStock <= 0;
}

public record CatalogResult(int PageIndex, int PageSize, int Count, List<CatalogItem> Data);
public record CatalogBrand(int Id, string Brand);
public record CatalogItemType(int Id, string Type);
