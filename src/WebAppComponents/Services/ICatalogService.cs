using System.Collections.Generic;
using System.Threading.Tasks;
using eShop.WebAppComponents.Catalog;

namespace eShop.WebAppComponents.Services
{
    public interface ICatalogService
    {
        Task<CatalogItem?> GetCatalogItem(int id);
        Task<CatalogResult> GetCatalogItems(int pageIndex, int pageSize, int[]? brands, int[]? types);
        // Default keeps implementations that cannot filter by stock (the hybrid app) compiling;
        // they return every item, as before.
        Task<CatalogResult> GetCatalogItems(int pageIndex, int pageSize, int[]? brands, int[]? types, bool onlyAvailable)
            => GetCatalogItems(pageIndex, pageSize, brands, types);
        Task<List<CatalogItem>> GetCatalogItems(IEnumerable<int> ids);
        Task<CatalogResult> GetCatalogItemsWithSemanticRelevance(int page, int take, string text);
        Task<IEnumerable<CatalogBrand>> GetBrands();
        Task<IEnumerable<CatalogItemType>> GetTypes();
    }
}
