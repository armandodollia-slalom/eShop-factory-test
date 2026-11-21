<!-- head: 998cbf715d3cf7f4e5e6ce46019ad98b5d485fb9 -->
## API changes

HTTP endpoints this PR adds, changes or removes (read by the `aspnet-minimal-api` route extractor), documented from OpenAPI and illustrated with the calls its e2e specs (`e2e/teststack/bug-56.spec.ts`) made (commit 998cbf7, [workflow run](https://github.com/armandodollia-slalom/eShop-factory-test/actions/runs/44469136325)).

| Change | Method | Endpoint | Service | Request | Responses | Recorded calls |
| --- | --- | --- | --- | --- | --- | --- |
| ✏️ Changed | `POST` | `/api/orders/draft` | ordering-api | `CreateOrderDraftCommand` | 200, 400, 401, 403 | 4 (200, 400) |

### `POST /api/orders/draft`

✏️ Changed in `src/Ordering.API/Apis/OrdersApi.cs:17` · API versions 1.0

**Parameters:** `api-version` (query, string, required)

**Request body:** `application/json` `CreateOrderDraftCommand`
<br>Fields: `buyerId: string`, `items: array`

**Responses:** `200` `OrderDraftDTO` OK · `400` `ProblemDetails` Bad Request · `401` Unauthorized · `403` Forbidden

<details><summary>Example: <code>200</code> · TC-BUG-56-01 a valid draft is answered with 200 and the computed draft</summary>

**Request**

```http
POST /api/orders/draft?api-version=1.0
Authorization: ***
Content-Type: application/json

{
  "buyerId": "9e3163b9-1ae6-4652-9dc6-7898ab7b7a00",
  "items": [
    {
      "id": "1",
      "productId": 99,
      "productName": "Adventurer GPS Watch",
      "unitPrice": 10,
      "oldUnitPrice": 10,
      "quantity": 2,
      "pictureUrl": ""
    }
  ]
}
```

**Response** `200` `application/json; charset=utf-8`

```json
{
  "orderItems": [
    {
      "productId": 99,
      "productName": "Adventurer GPS Watch",
      "unitPrice": 10,
      "discount": 0,
      "units": 2,
      "pictureUrl": ""
    }
  ],
  "total": 20
}
```

</details>
<details><summary>Example: <code>400</code> · TC-BUG-56-02 a draft line with quantity 0 is answered with 400 problem details naming the quantity</summary>

**Request**

```http
POST /api/orders/draft?api-version=1.0
Authorization: ***
Content-Type: application/json

{
  "buyerId": "9e3163b9-1ae6-4652-9dc6-7898ab7b7a00",
  "items": [
    {
      "id": "1",
      "productId": 99,
      "productName": "Adventurer GPS Watch",
      "unitPrice": 10,
      "oldUnitPrice": 10,
      "quantity": 0,
      "pictureUrl": ""
    }
  ]
}
```

**Response** `400` `application/problem+json`

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "Bad Request",
  "status": 400,
  "detail": "The quantity of each item must be at least 1.",
  "traceId": "00-081cbb23a92443e921c7e258b91b6120-5fcddd8aa36a5e37-01"
}
```

</details>

<sub>Updated by `.github/workflows/factory-pr-demo-video.yml` on every push; edits inside this section are overwritten. Secrets in recorded calls are redacted and long bodies truncated.</sub>
