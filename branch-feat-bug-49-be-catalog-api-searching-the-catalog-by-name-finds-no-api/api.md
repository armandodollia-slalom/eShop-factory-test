<!-- head: e407279f835ca29a3245a60389066ae30022dea3 -->
## API changes

HTTP endpoints this PR adds, changes or removes (read by the `aspnet-minimal-api` route extractor), documented from OpenAPI and illustrated with the calls its e2e specs (`e2e/teststack/bug-49.spec.ts`) made (commit e407279, [workflow run](https://github.com/armandodollia-slalom/eShop-factory-test/actions/runs/44225587523)).

| Change | Method | Endpoint | Service | Request | Responses | Recorded calls |
| --- | --- | --- | --- | --- | --- | --- |
| ✏️ Changed | `GET` | `/api/catalog/items` | catalog-api |  | 200, 400 | 4 (200) |

### `GET /api/catalog/items`

✏️ Changed in `src/Catalog.API/Apis/CatalogApi.cs:22` · API versions 1.0, 2.0

List catalog items

**Parameters:** `PageSize` (query, integer | string(int32)), `PageIndex` (query, integer | string(int32)), `name` (query, string), `type` (query, integer | string(int32)[]), `brand` (query, integer | string(int32)[]), `api-version` (query, string, required)

**Responses:** `200` `PaginatedItemsOfCatalogItem` OK · `400` `ProblemDetails` Bad Request

<details><summary>Example: <code>200</code> · TC-BUG-49-01 searching "Boots" lists all three boots with count 3</summary>

**Request**

```http
GET /api/catalog/items?name=Boots&api-version=2.0
```

**Response** `200` `application/json; charset=utf-8`

```json
{
  "pageIndex": 0,
  "pageSize": 10,
  "count": 3,
  "data": [
    {
      "id": 71,
      "name": "Explorer Frost Boots",
      "description": "The Explorer Frost Boots by Daybird are the perfect companion for cold-weather adventures. These premium boots are designed with a waterproof and insulated shell, keeping your feet warm and protected in icy conditions. The sleek black design with blue accents adds a touch of style to your outdoor gear.",
      "price": 149.99,
      "pictureFileName": "71.webp",
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
      "id": 60,
      "name": "SummitRider Snowboard Boots",
      "description": "Conquer the mountains in style with the SummitRider Snowboard Boots in matte black. These high-performance boots combine comfort, durability, and response to enhance your riding experience. Featuring a heat-moldable liner, dual-zone lacing system, and impact-resistant outsole, they provide a precise and snug fit, ensuring maximum control on any terrain. Get ready to take on the slopes like a pro!",
      "price": 249,
      "pictureFileName": "60.webp",
      "catalogTypeId": 3,
      "catalogType": null,
      "catalogBrandId": 3,
      "catalogBrand": {
        "id": 3,
        "brand": "WildRunner"
      },
  
… (truncated)
```

</details>

<sub>Updated by `.github/workflows/factory-pr-demo-video.yml` on every push; edits inside this section are overwritten. Secrets in recorded calls are redacted and long bodies truncated.</sub>
