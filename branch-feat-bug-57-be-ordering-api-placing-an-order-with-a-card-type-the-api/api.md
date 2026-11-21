<!-- head: 3aa06fdbbc3e00afb1ef6500268772a724f249d6 -->
## API changes

HTTP endpoints this PR adds, changes or removes (read by the `aspnet-minimal-api` route extractor), documented from OpenAPI and illustrated with the calls its e2e specs made (commit 3aa06fd).

| Change | Method | Endpoint | Service | Request | Responses | Recorded calls |
| --- | --- | --- | --- | --- | --- | --- |
| ✏️ Changed | `POST` | `/api/orders` | ordering-api |  |  | 4 (200, 400) |
| 🧪 Exercised | `GET` | `/api/orders` | ordering-api |  |  | 11 (200) |
| 🧪 Exercised | `GET` | `/api/orders/cardtypes` | ordering-api |  |  | 1 (200) |

### `POST /api/orders`

✏️ Changed in `src/Ordering.API/Apis/OrdersApi.cs:19` · API versions 1.0

_Not in the OpenAPI documents._

<details><summary>Example: <code>200</code> · TC-BUG-57-01 an order with card type 2 (Visa) is placed with 200; TC-BUG-57-02 repeating it with card type 99 answers 400 under CardTypeId and places no order</summary>

**Request**

```http
POST /api/orders?api-version=1.0
Authorization: ***
x-requestid: cfcb28b8-cc3c-4a45-98c8-c088a09f2727
Content-Type: application/json

{
  "userId": "50ddac7e-9b69-4d68-a91b-25100ef2e403",
  "userName": "alice",
  "city": "Redmond",
  "street": "15703 NE 61st Ct",
  "state": "WA",
  "country": "U.S.",
  "zipCode": "98052",
  "cardNumber": "4111111111111111",
  "cardHolderName": "Alice Smith",
  "cardExpiration": "2030-12-31T00:00:00Z",
  "cardSecurityNumber": "123",
  "cardTypeId": 2,
  "buyer": "50ddac7e-9b69-4d68-a91b-25100ef2e403",
  "items": [
    {
      "id": "1",
      "productId": 99,
      "productName": "Adventurer GPS Watch",
      "unitPrice": 199.99,
      "oldUnitPrice": 199.99,
      "quantity": 1,
      "pictureUrl": ""
    }
  ]
}
```

**Response** `200`

_(empty body)_

</details>
<details><summary>Example: <code>400</code> · TC-BUG-57-01 an order with card type 2 (Visa) is placed with 200; TC-BUG-57-02 repeating it with card type 99 answers 400 under CardTypeId and places no order</summary>

**Request**

```http
POST /api/orders?api-version=1.0
Authorization: ***
x-requestid: d56b2058-f13a-4eb1-9de9-4ec73adb65d9
Content-Type: application/json

{
  "userId": "50ddac7e-9b69-4d68-a91b-25100ef2e403",
  "userName": "alice",
  "city": "Redmond",
  "street": "15703 NE 61st Ct",
  "state": "WA",
  "country": "U.S.",
  "zipCode": "98052",
  "cardNumber": "4111111111111111",
  "cardHolderName": "Alice Smith",
  "cardExpiration": "2030-12-31T00:00:00Z",
  "cardSecurityNumber": "123",
  "cardTypeId": 99,
  "buyer": "50ddac7e-9b69-4d68-a91b-25100ef2e403",
  "items": [
    {
      "id": "1",
      "productId": 99,
      "productName": "Adventurer GPS Watch",
      "unitPrice": 199.99,
      "oldUnitPrice": 199.99,
      "quantity": 1,
      "pictureUrl": ""
    }
  ]
}
```

**Response** `400` `application/problem+json`

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "CardTypeId": [
      "Card type 99 is not known."
    ]
  },
  "traceId": "00-ebdc7a88406dcafb4b3282f7a9722d00-890b71b5f6ed1eb5-01"
}
```

</details>

### `GET /api/orders`

🧪 Exercised in `src/Ordering.API/Apis/OrdersApi.cs:15` · API versions 1.0

_Not in the OpenAPI documents._

<details><summary>Example: <code>200</code> · TC-BUG-57-01 an order with card type 2 (Visa) is placed with 200; TC-BUG-57-02 repeating it with card type 99 answers 400 under CardTypeId and places no order</summary>

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

### `GET /api/orders/cardtypes`

🧪 Exercised in `src/Ordering.API/Apis/OrdersApi.cs:16` · API versions 1.0

_Not in the OpenAPI documents._

<details><summary>Example: <code>200</code> · TC-BUG-57-01 an order with card type 2 (Visa) is placed with 200; TC-BUG-57-02 repeating it with card type 99 answers 400 under CardTypeId and places no order</summary>

**Request**

```http
GET /api/orders/cardtypes?api-version=1.0
Authorization: ***
```

**Response** `200` `application/json; charset=utf-8`

```json
[
  {
    "id": 1,
    "name": "Amex"
  },
  {
    "id": 2,
    "name": "Visa"
  },
  {
    "id": 3,
    "name": "MasterCard"
  }
]
```

</details>

<sub>Updated by `.github/workflows/factory-pr-demo-video.yml` on every push; edits inside this section are overwritten. Secrets in recorded calls are redacted and long bodies truncated.</sub>
