<!-- head: c1183f65bea5376801e4d79230db335c2d34d8be -->
## API changes

HTTP endpoints this PR adds, changes or removes (read by the `aspnet-minimal-api` route extractor), documented from OpenAPI and illustrated with the calls its e2e specs (`e2e/teststack/bug-54.spec.ts`) made (commit c1183f6, [workflow run](https://github.com/armandodollia-slalom/eShop-factory-test/actions/runs/44393786900)).

| Change | Method | Endpoint | Service | Request | Responses | Recorded calls |
| --- | --- | --- | --- | --- | --- | --- |
| ✏️ Changed | `POST` | `/api/orders` | ordering-api | `CreateOrderRequest` | 200, 400, 401, 403 | 8 (200) |
| ✏️ Changed | `PUT` | `/api/orders/cancel` | ordering-api | `CancelOrderCommand` | 200, 400, 401, 403, 404 | 10 (200, 401, 404) |
| 🧪 Exercised | `GET` | `/api/orders` | ordering-api |  | 200, 401, 403 | 19 (200) |
| 🧪 Exercised | `GET` | `/api/orders/{orderId}` | ordering-api |  | 200, 401, 403, 404 | 7 (200, 404) |

### `POST /api/orders`

✏️ Changed in `src/Ordering.API/Apis/OrdersApi.cs:19` · API versions 1.0

**Parameters:** `x-requestid` (header, string(uuid), required), `api-version` (query, string, required)

**Request body:** `application/json` `CreateOrderRequest`
<br>Fields: `userId: string`, `userName: string`, `city: string`, `street: string`, `state: string`, `country: string`, `zipCode: string`, `cardNumber: string`, `cardHolderName: string`, `cardExpiration: string(date-time)`, `cardSecurityNumber: string`, `cardTypeId: integer | string(int32)`, `buyer: string`, `items: array`

**Responses:** `200` OK · `400` `HttpValidationProblemDetails` Bad Request · `401` Unauthorized · `403` Forbidden

<details><summary>Example: <code>200</code> · TC-BUG-54-01 alice cancels her own Submitted order: 200 and the order reads Cancelled</summary>

**Request**

```http
POST /api/orders?api-version=1.0
Authorization: ***
x-requestid: 7e9d1ee1-f051-4c61-8e3e-02a6e861a110

{
  "userId": "50ddac7e-9b69-4d68-a91b-25100ef2e403",
  "userName": "alice",
  "city": "Redmond",
  "street": "15703 NE 61st Ct",
  "state": "WA",
  "country": "U.S.",
  "zipCode": "98052",
  "cardNumber": "4012888888881881",
  "cardHolderName": "Alice Smith",
  "cardExpiration": "2030-12-31T00:00:00Z",
  "cardSecurityNumber": "123",
  "cardTypeId": 2,
  "buyer": "alice",
  "items": [
    {
      "id": "1",
      "productId": 99,
      "productName": "Adventurer GPS Watch",
      "unitPrice": 10,
      "oldUnitPrice": 10,
      "quantity": 1,
      "pictureUrl": null
    }
  ]
}
```

**Response** `200`

_(empty body)_

</details>

### `PUT /api/orders/cancel`

✏️ Changed in `src/Ordering.API/Apis/OrdersApi.cs:12` · API versions 1.0

**Parameters:** `x-requestid` (header, string(uuid), required), `api-version` (query, string, required)

**Request body:** `application/json` `CancelOrderCommand`
<br>Fields: `orderNumber: integer | string(int32)`

**Responses:** `200` OK · `400` `string` Bad Request · `401` Unauthorized · `403` Forbidden · `404` Not Found

<details><summary>Example: <code>200</code> · TC-BUG-54-01 alice cancels her own Submitted order: 200 and the order reads Cancelled</summary>

**Request**

```http
PUT /api/orders/cancel?api-version=1.0
Authorization: ***
x-requestid: 7dba7567-4c03-42a0-ae3c-18673fe9e35e

{
  "orderNumber": 1
}
```

**Response** `200`

_(empty body)_

</details>
<details><summary>Example: <code>401</code> · TC-BUG-54-06 A cancel request without a token is refused with 401 and alice's order stays Submitted</summary>

**Request**

```http
PUT /api/orders/cancel?api-version=1.0
x-requestid: aefe8eba-a0de-4dca-ae55-6d611babe895

{
  "orderNumber": 7
}
```

**Response** `401`

_(empty body)_

</details>
<details><summary>Example: <code>404</code> · TC-BUG-54-03 alice's order is still Submitted after bob's refused cancel</summary>

**Request**

```http
PUT /api/orders/cancel?api-version=1.0
Authorization: ***
x-requestid: 8c8ec657-185b-4504-b04e-ce570f4cf89b

{
  "orderNumber": 2
}
```

**Response** `404`

_(empty body)_

</details>

### `GET /api/orders`

🧪 Exercised in `src/Ordering.API/Apis/OrdersApi.cs:15` · API versions 1.0

**Parameters:** `api-version` (query, string, required)

**Responses:** `200` `OrderSummary[]` OK · `401` Unauthorized · `403` Forbidden

<details><summary>Example: <code>200</code> · TC-BUG-54-01 alice cancels her own Submitted order: 200 and the order reads Cancelled</summary>

**Request**

```http
GET /api/orders?api-version=1.0
Authorization: ***
```

**Response** `200` `application/json; charset=utf-8`

```json
[]
```

</details>

### `GET /api/orders/{orderId}`

🧪 Exercised in `src/Ordering.API/Apis/OrdersApi.cs:14` · API versions 1.0

**Parameters:** `orderId` (path, integer(int32), required), `api-version` (query, string, required)

**Responses:** `200` `Order` OK · `401` Unauthorized · `403` Forbidden · `404` Not Found

<details><summary>Example: <code>200</code> · TC-BUG-54-01 alice cancels her own Submitted order: 200 and the order reads Cancelled</summary>

**Request**

```http
GET /api/orders/1?api-version=1.0
Authorization: ***
```

**Response** `200` `application/json; charset=utf-8`

```json
{
  "orderNumber": 1,
  "date": "2026-11-18T20:48:45.735993Z",
  "status": "Cancelled",
  "description": "The order was cancelled.",
  "street": "15703 NE 61st Ct",
  "city": "Redmond",
  "state": "WA",
  "zipcode": "98052",
  "country": "U.S.",
  "orderItems": [
    {
      "productName": "Adventurer GPS Watch",
      "units": 1,
      "unitPrice": 10,
      "pictureUrl": null
    }
  ],
  "total": 10
}
```

</details>
<details><summary>Example: <code>404</code> · TC-BUG-54-05 bob's refusal for alice's order matches his answer for a missing order, before and after bob has an order of his own</summary>

**Request**

```http
GET /api/orders/999999?api-version=1.0
Authorization: ***
```

**Response** `404`

_(empty body)_

</details>

<sub>Updated by `.github/workflows/factory-pr-demo-video.yml` on every push; edits inside this section are overwritten. Secrets in recorded calls are redacted and long bodies truncated.</sub>
