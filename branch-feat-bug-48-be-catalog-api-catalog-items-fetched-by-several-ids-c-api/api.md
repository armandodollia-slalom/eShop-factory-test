<!-- head: 34540dd225a8223c3660910fd85b6b8e60796870 -->
## API changes

HTTP endpoints this PR adds, changes or removes (read by the `aspnet-minimal-api` route extractor), documented from OpenAPI and illustrated with the calls its e2e specs (`e2e/teststack/bug-48.spec.ts`) made (commit 34540dd, [workflow run](https://github.com/armandodollia-slalom/eShop-factory-test/actions/runs/44215596905)).

| Change | Method | Endpoint | Service | Request | Responses | Recorded calls |
| --- | --- | --- | --- | --- | --- | --- |
| ✏️ Changed | `GET` | `/api/catalog/items/by` | catalog-api |  | 200, 400 | 3 (200) |
| 🧪 Exercised | `GET` | `/api/catalog/items` | catalog-api |  | 200, 400 | 1 (200) |
| 🧪 Exercised | `GET` | `/api/catalog/items/{id}` | catalog-api |  | 200, 400, 404 | 2 (200) |

### `GET /api/catalog/items/by`

✏️ Changed in `src/Catalog.API/Apis/CatalogApi.cs:32` · API versions 1.0, 2.0

Batch get catalog items

**Parameters:** `ids` (query, integer | string(int32)[], required), `api-version` (query, string, required)

**Responses:** `200` `CatalogItem[]` OK · `400` `ProblemDetails` Bad Request

<details><summary>Example: <code>200</code> · TC-BUG-48-01 items 1 and 2 fetched by ids each carry their own brand</summary>

**Request**

```http
GET /api/catalog/items/by?ids=1&ids=2&api-version=1.0
```

**Response** `200` `application/json; charset=utf-8`

```json
[
  {
    "id": 1,
    "name": "Wanderer Black Hiking Boots",
    "description": "Daybird's Wanderer Hiking Boots in sleek black are perfect for all your outdoor adventures. These boots are made with a waterproof leather upper and a durable rubber sole for superior traction. With their cushioned insole and padded collar, these boots will keep you comfortable all day long.",
    "price": 109.99,
    "pictureFileName": "1.webp",
    "catalogTypeId": 1,
    "catalogType": null,
    "catalogBrandId": 1,
    "catalogBrand": {
      "id": 1,
      "brand": "Daybird"
    },
    "availableStock": 100,
    "restockThreshold": 10,
    "maxStockThreshold": 200,
    "onReorder": false
  },
  {
    "id": 2,
    "name": "Summit Pro Harness",
    "description": "Conquer new heights with the Summit Pro Harness by Gravitator. This lightweight and durable climbing harness features adjustable leg loops and waist belt for a customized fit. With its vibrant blue color, you'll look stylish while maneuvering difficult routes. Safety is a top priority with a reinforced tie-in point and strong webbing loops.",
    "price": 89.99,
    "pictureFileName": "2.webp",
    "catalogTypeId": 2,
    "catalogType": null,
    "catalogBrandId": 2,
    "catalogBrand": {
      "id": 2,
      "brand": "Gravitator"
    },
    "availableStock": 100,
    "restockThreshold": 10,
    "maxStockThreshold": 200,
    "onReorder": false
  }
]
```

</details>

### `GET /api/catalog/items`

🧪 Exercised in `src/Catalog.API/Apis/CatalogApi.cs:22` · API versions 1.0, 2.0

List catalog items

**Parameters:** `PageSize` (query, integer | string(int32)), `PageIndex` (query, integer | string(int32)), `name` (query, string), `type` (query, integer | string(int32)[]), `brand` (query, integer | string(int32)[]), `api-version` (query, string, required)

**Responses:** `200` `PaginatedItemsOfCatalogItem` OK · `400` `ProblemDetails` Bad Request

<details><summary>Example: <code>200</code> · TC-BUG-48-03 an item fetched by ids carries the same brand as in the catalog list</summary>

**Request**

```http
GET /api/catalog/items?pageSize=1&pageIndex=0&api-version=1.0
```

**Response** `200` `application/json; charset=utf-8`

```json
{
  "pageIndex": 0,
  "pageSize": 1,
  "count": 101,
  "data": [
    {
      "id": 99,
      "name": "Adventurer GPS Watch",
      "description": "Take navigation to the next level with the Solstix Adventurer GPS Watch. This sleek and durable watch, in midnight blue, features a built-in GPS, altimeter, and compass, allowing you to track your routes and monitor your progress. With multiple sport modes, it's the ideal companion for outdoor enthusiasts.",
      "price": 199.99,
      "pictureFileName": "99.webp",
      "catalogTypeId": 7,
      "catalogType": null,
      "catalogBrandId": 7,
      "catalogBrand": {
        "id": 7,
        "brand": "Solstix"
      },
      "availableStock": 100,
      "restockThreshold": 10,
      "maxStockThreshold": 200,
      "onReorder": false
    }
  ]
}
```

</details>

### `GET /api/catalog/items/{id}`

🧪 Exercised in `src/Catalog.API/Apis/CatalogApi.cs:37` · API versions 1.0, 2.0

Get catalog item

**Parameters:** `id` (path, integer(int32), required), `api-version` (query, string, required)

**Responses:** `200` `CatalogItem` OK · `400` `ProblemDetails` Bad Request · `404` Not Found

<details><summary>Example: <code>200</code> · TC-BUG-48-02 each item fetched by ids is identical to the same item fetched on its own</summary>

**Request**

```http
GET /api/catalog/items/1?api-version=1.0
```

**Response** `200` `application/json; charset=utf-8`

```json
{
  "id": 1,
  "name": "Wanderer Black Hiking Boots",
  "description": "Daybird's Wanderer Hiking Boots in sleek black are perfect for all your outdoor adventures. These boots are made with a waterproof leather upper and a durable rubber sole for superior traction. With their cushioned insole and padded collar, these boots will keep you comfortable all day long.",
  "price": 109.99,
  "pictureFileName": "1.webp",
  "catalogTypeId": 1,
  "catalogType": null,
  "catalogBrandId": 1,
  "catalogBrand": {
    "id": 1,
    "brand": "Daybird"
  },
  "availableStock": 100,
  "restockThreshold": 10,
  "maxStockThreshold": 200,
  "onReorder": false
}
```

</details>

<sub>Updated by `.github/workflows/factory-pr-demo-video.yml` on every push; edits inside this section are overwritten. Secrets in recorded calls are redacted and long bodies truncated.</sub>
