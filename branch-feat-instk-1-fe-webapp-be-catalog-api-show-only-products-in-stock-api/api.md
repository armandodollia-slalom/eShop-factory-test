<!-- head: 0555dd605774445ab1680279eafe25df43398231 -->
## API changes

HTTP endpoints this PR adds, changes or removes (read by the `aspnet-minimal-api` route extractor), documented from OpenAPI and illustrated with the calls its e2e specs (`e2e/teststack/instk-1.spec.ts`) made (commit 0555dd6, [workflow run](https://github.com/armandodollia-slalom/eShop-factory-test/actions/runs/44609219649)).

| Change | Method | Endpoint | Service | Request | Responses | Recorded calls |
| --- | --- | --- | --- | --- | --- | --- |
| ✏️ Changed | `GET` | `/api/catalog/catalogbrands` | catalog-api |  | 200, 400 |  |
| ✏️ Changed | `GET` | `/api/catalog/catalogtypes` | catalog-api |  | 200, 400 |  |
| ✏️ Changed | `GET` | `/api/catalog/items` | catalog-api |  | 200, 400 | 2 (200) |
| ✏️ Changed | `GET` | `/api/catalog/items/by/{name}` | catalog-api |  | 200, 400 |  |
| ✏️ Changed | `GET` | `/api/catalog/items/type/{typeId}/brand/{brandId?}` | catalog-api |  | 200, 400 |  |
| ✏️ Changed | `GET` | `/api/catalog/items/type/all/brand/{brandId?}` | catalog-api |  | 200, 400 |  |

### `GET /api/catalog/catalogbrands`

✏️ Changed in `src/Catalog.API/Apis/CatalogApi.cs:96` · API versions 1.0, 2.0

List catalog item brands

**Parameters:** `api-version` (query, string, required)

**Responses:** `200` `CatalogBrand[]` OK · `400` `ProblemDetails` Bad Request

### `GET /api/catalog/catalogtypes`

✏️ Changed in `src/Catalog.API/Apis/CatalogApi.cs:89` · API versions 1.0, 2.0

List catalog item types

**Parameters:** `api-version` (query, string, required)

**Responses:** `200` `CatalogType[]` OK · `400` `ProblemDetails` Bad Request

### `GET /api/catalog/items`

✏️ Changed in `src/Catalog.API/Apis/CatalogApi.cs:22` · API versions 1.0, 2.0

List catalog items

**Parameters:** `PageSize` (query, integer | string(int32)), `PageIndex` (query, integer | string(int32)), `name` (query, string), `type` (query, integer | string(int32)[]), `brand` (query, integer | string(int32)[]), `inStock` (query, boolean), `api-version` (query, string, required)

**Responses:** `200` `PaginatedItemsOfCatalogItem` OK · `400` `ProblemDetails` Bad Request

<details><summary>Example: <code>200</code> · Catalog API › TC-INSTK-1-03 inStock=true filters before paging (type filter, second page)</summary>

**Request**

```http
GET /api/catalog/items?api-version=2.0&inStock=true&type=3&PageSize=9&PageIndex=1
```

**Response** `200` `application/json; charset=utf-8`

```json
{
  "pageIndex": 1,
  "pageSize": 9,
  "count": 14,
  "data": [
    {
      "id": 12,
      "name": "Powder Pro Snowboard",
      "description": "The Powder Pro Snowboard by Zephyr is designed for the ultimate ride through deep snow. Its floating camber allows for effortless turns and smooth maneuverability, while the lightweight carbon fiber construction ensures maximum control at high speeds. This board, available in vibrant turquoise, is a must-have for any backcountry shredder.",
      "price": 399,
      "pictureFileName": "12.webp",
      "catalogTypeId": 3,
      "catalogType": null,
      "catalogBrandId": 11,
      "catalogBrand": {
        "id": 11,
        "brand": "Zephyr"
      },
      "availableStock": 100,
      "restockThreshold": 10,
      "maxStockThreshold": 200,
      "onReorder": false
    },
    {
      "id": 62,
      "name": "Shadow Black Snowboard",
      "description": "Conquer the slopes with the Daybird Shadow Black Snowboard. This sleek and stylish snowboard features a black colorway, a camber profile for maximum stability, and a medium-flex rating for responsive turns and tricks. Its lightweight construction ensures easy maneuverability, while the sintered base provides excellent speed and durability. Whether you're shredding on groomed runs or exploring the backcountry, this snowboard is designed to deliver peak performance.",
      "price": 379,
      "pictureFileName": "62.webp",
      "catalogTypeId": 3,
      "catalogType": null,
      "cat
… (truncated)
```

</details>

### `GET /api/catalog/items/by/{name}`

✏️ Changed in `src/Catalog.API/Apis/CatalogApi.cs:42` · API versions 1.0

Get catalog items by name

**Parameters:** `PageSize` (query, integer | string(int32)), `PageIndex` (query, integer | string(int32)), `name` (path, string, required), `api-version` (query, string, required)

**Responses:** `200` `PaginatedItemsOfCatalogItem` OK · `400` `ProblemDetails` Bad Request

### `GET /api/catalog/items/type/{typeId}/brand/{brandId?}`

✏️ Changed in `src/Catalog.API/Apis/CatalogApi.cs:79` · API versions 1.0

Get catalog items by type and brand

**Parameters:** `PageSize` (query, integer | string(int32)), `PageIndex` (query, integer | string(int32)), `typeId` (path, integer | string(int32), required), `brandId` (path, integer | string(int32), required), `api-version` (query, string, required)

**Responses:** `200` `PaginatedItemsOfCatalogItem` OK · `400` `ProblemDetails` Bad Request

### `GET /api/catalog/items/type/all/brand/{brandId?}`

✏️ Changed in `src/Catalog.API/Apis/CatalogApi.cs:84` · API versions 1.0

List catalog items by brand

**Parameters:** `PageSize` (query, integer | string(int32)), `PageIndex` (query, integer | string(int32)), `brandId` (path, integer | string(int32), required), `api-version` (query, string, required)

**Responses:** `200` `PaginatedItemsOfCatalogItem` OK · `400` `ProblemDetails` Bad Request

<sub>Updated by `.github/workflows/factory-pr-demo-video.yml` on every push; edits inside this section are overwritten. Secrets in recorded calls are redacted and long bodies truncated.</sub>
