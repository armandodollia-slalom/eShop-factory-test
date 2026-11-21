<!-- head: a40369eebe28fc6ef8ad9348af079212f371cb08 -->
## API changes

HTTP endpoints this PR adds, changes or removes (read by the `aspnet-minimal-api` route extractor), documented from OpenAPI and illustrated with the calls its e2e specs (`e2e/teststack/ship-1.spec.ts`) made (commit a40369e, [workflow run](https://github.com/armandodollia-slalom/eShop-factory-test/actions/runs/44320115262)).

| Change | Method | Endpoint | Service | Request | Responses | Recorded calls |
| --- | --- | --- | --- | --- | --- | --- |
| 🧪 Exercised | `GET` | `/api/orders` | ordering-api |  | 200, 401, 403 | 21 (200) |
| 🧪 Exercised | `POST` | `/api/orders` | ordering-api | `CreateOrderRequest` | 200, 400, 401, 403 | 9 (200) |

### `GET /api/orders`

🧪 Exercised in `src/Ordering.API/Apis/OrdersApi.cs:15` · API versions 1.0

**Parameters:** `api-version` (query, string, required)

**Responses:** `200` `OrderSummary[]` OK · `401` Unauthorized · `403` Forbidden

<details><summary>Example: <code>200</code> · TC-SHIP-1-01 the order list returns each order's city and country as entered at checkout</summary>

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

### `POST /api/orders`

🧪 Exercised in `src/Ordering.API/Apis/OrdersApi.cs:19` · API versions 1.0

**Parameters:** `x-requestid` (header, string(uuid), required), `api-version` (query, string, required)

**Request body:** `application/json` `CreateOrderRequest`
<br>Fields: `userId: string`, `userName: string`, `city: string`, `street: string`, `state: string`, `country: string`, `zipCode: string`, `cardNumber: string`, `cardHolderName: string`, `cardExpiration: string(date-time)`, `cardSecurityNumber: string`, `cardTypeId: integer | string(int32)`, `buyer: string`, `items: array`

**Responses:** `200` OK · `400` `HttpValidationProblemDetails` Bad Request · `401` Unauthorized · `403` Forbidden

<details><summary>Example: <code>200</code> · TC-SHIP-1-01 the order list returns each order's city and country as entered at checkout</summary>

**Request**

```http
POST /api/orders?api-version=1.0
Authorization: ***
x-requestid: bc6fa06b-8995-41e6-a76d-f1c3fc844d1d

{
  "userId": "50ddac7e-9b69-4d68-a91b-25100ef2e403",
  "userName": "alice",
  "street": "15703 NE 61st Ct",
  "city": "Redmond",
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

<sub>Updated by `.github/workflows/factory-pr-demo-video.yml` on every push; edits inside this section are overwritten. Secrets in recorded calls are redacted and long bodies truncated.</sub>
