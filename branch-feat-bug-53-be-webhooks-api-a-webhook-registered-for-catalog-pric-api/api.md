<!-- head: 8e5de6c9ef9220b98fdf26c74c00aa50830342a9 -->
## API changes

HTTP endpoints this PR adds, changes or removes (read by the `aspnet-minimal-api` route extractor), documented from OpenAPI and illustrated with the calls its e2e specs (`e2e/teststack/bug-53.spec.ts`) made (commit 8e5de6c, [workflow run](https://github.com/armandodollia-slalom/eShop-factory-test/actions/runs/44354478328)).

| Change | Method | Endpoint | Service | Request | Responses | Recorded calls |
| --- | --- | --- | --- | --- | --- | --- |
| 🧪 Exercised | `GET` | `/api/catalog/items/{id}` | catalog-api |  | 200, 400, 404 | 3 (200) |
| 🧪 Exercised | `PUT` | `/api/catalog/items/{id}` | catalog-api | `CatalogItem` | 201, 400, 404 | 2 (201) |
| 🧪 Exercised | `GET` | `/api/webhooks` | webhooks-api |  | 200, 401, 403 | 1 (200) |
| 🧪 Exercised | `POST` | `/api/webhooks` | webhooks-api | `WebhookSubscriptionRequest` | 201, 400, 401, 403 | 4 (201) |

### `GET /api/catalog/items/{id}`

🧪 Exercised in `src/Catalog.API/Apis/CatalogApi.cs:37` · API versions 1.0, 2.0

Get catalog item

**Parameters:** `id` (path, integer(int32), required), `api-version` (query, string, required)

**Responses:** `200` `CatalogItem` OK · `400` `ProblemDetails` Bad Request · `404` Not Found

<details><summary>Example: <code>200</code> · TC-BUG-53-01 changing item 99's price calls the CatalogItemPriceChange webhook once with id, new and old price, and no order webhook</summary>

**Request**

```http
GET /api/catalog/items/99?api-version=2.0
```

**Response** `200` `application/json; charset=utf-8`

```json
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
```

</details>

### `PUT /api/catalog/items/{id}`

🧪 Exercised in `src/Catalog.API/Apis/CatalogApi.cs:110` · API versions 2.0

Create or replace a catalog item

**Parameters:** `id` (path, integer(int32), required), `api-version` (query, string, required)

**Request body:** `application/json` `CatalogItem` (required)
<br>Fields: `id: integer | string(int32)`, `name: string`, `description: string`, `price: number | string(double)`, `pictureFileName: string`, `catalogTypeId: integer | string(int32)`, `catalogType: object`, `catalogBrandId: integer | string(int32)`, `catalogBrand: object`, `availableStock: integer | string(int32)`, `restockThreshold: integer | string(int32)`, `maxStockThreshold: integer | string(int32)`, `onReorder: boolean`

**Responses:** `201` Created · `400` `ProblemDetails` Bad Request · `404` `ProblemDetails` Not Found

<details><summary>Example: <code>201</code> · TC-BUG-53-01 changing item 99's price calls the CatalogItemPriceChange webhook once with id, new and old price, and no order webhook</summary>

**Request**

```http
PUT /api/catalog/items/99?api-version=2.0

{
  "id": 99,
  "name": "Adventurer GPS Watch",
  "description": "Take navigation to the next level with the Solstix Adventurer GPS Watch. This sleek and durable watch, in midnight blue, features a built-in GPS, altimeter, and compass, allowing you to track your routes and monitor your progress. With multiple sport modes, it's the ideal companion for outdoor enthusiasts.",
  "price": 149.99,
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
```

**Response** `201`

_(empty body)_

</details>

### `GET /api/webhooks`

🧪 Exercised in `src/Webhooks.API/Apis/WebHooksApi.cs:13` · API versions 1.0

**Parameters:** `api-version` (query, string, required)

**Responses:** `200` `WebhookSubscription[]` OK · `401` Unauthorized · `403` Forbidden

<details><summary>Example: <code>200</code> · TC-BUG-53-01 changing item 99's price calls the CatalogItemPriceChange webhook once with id, new and old price, and no order webhook</summary>

**Request**

```http
GET /api/webhooks?api-version=1.0
Authorization: ***
```

**Response** `200` `application/json; charset=utf-8`

```json
[
  {
    "id": 1,
    "type": 3,
    "date": "2026-11-18T17:09:00.344913Z",
    "destUrl": "http://webhooksclient:8080/webhook-received",
    "token": "***",
    "userId": "50ddac7e-9b69-4d68-a91b-25100ef2e403"
  },
  {
    "id": 2,
    "type": 2,
    "date": "2026-11-18T17:09:00.626091Z",
    "destUrl": "http://webhooksclient:8080/webhook-received",
    "token": "***",
    "userId": "50ddac7e-9b69-4d68-a91b-25100ef2e403"
  },
  {
    "id": 3,
    "type": 1,
    "date": "2026-11-18T17:09:00.733049Z",
    "destUrl": "http://webhooksclient:8080/webhook-received",
    "token": "***",
    "userId": "50ddac7e-9b69-4d68-a91b-25100ef2e403"
  }
]
```

</details>

### `POST /api/webhooks`

🧪 Exercised in `src/Webhooks.API/Apis/WebHooksApi.cs:35` · API versions 1.0

**Parameters:** `api-version` (query, string, required)

**Request body:** `application/json` `WebhookSubscriptionRequest`
<br>Fields: `url: string`, `token: string`, `event: string`, `grantUrl: string`

**Responses:** `201` Created · `400` `string` Bad Request · `401` Unauthorized · `403` Forbidden

<details><summary>Example: <code>201</code> · TC-BUG-53-01 changing item 99's price calls the CatalogItemPriceChange webhook once with id, new and old price, and no order webhook</summary>

**Request**

```http
POST /api/webhooks?api-version=1.0
Authorization: ***

{
  "url": "http://webhooksclient:8080/webhook-received",
  "grantUrl": "http://webhooksclient:8080/check",
  "token": "***",
  "event": "OrderPaid"
}
```

**Response** `201`

_(empty body)_

</details>

<sub>Updated by `.github/workflows/factory-pr-demo-video.yml` on every push; edits inside this section are overwritten. Secrets in recorded calls are redacted and long bodies truncated.</sub>
