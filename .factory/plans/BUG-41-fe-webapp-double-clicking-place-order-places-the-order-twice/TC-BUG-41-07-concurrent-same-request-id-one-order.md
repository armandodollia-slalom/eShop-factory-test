---
id: TC-BUG-41-07
type: sad
sad-path: concurrency
layer: e2e
covers: ["Expected: a double-click (a second click before the page moves on) places exactly one order — server side"]
priority: P1
---

# TC-BUG-41-07: Two concurrent order requests with the same request id create one order

## Why

- The ticket's "second click before the page moves on" can reach the server when the browser guard does not run (script not yet loaded, enhanced navigation bypassed). Both posts then carry the same `x-requestid`; if Ordering lets both inserts race, the shopper is charged twice. An accepted order cannot be saved in the Ordering functional host, so this API-level case runs on the test stack (e2e layer, API calls as `alice`).

## Preconditions

- Test stack running with scenario `default`: user `alice` (id `50ddac7e-9b69-4d68-a91b-25100ef2e403`) has no orders.
- A bearer token for `alice` from Identity with the `orders` scope.

## Steps

1. Send these two requests at the same time (started together, without waiting for the first response), both as `alice`, both `POST /api/orders?api-version=1.0` with header `x-requestid: 3b7e0c52-9d41-4a6f-8e21-41c7f0d5a9b3`, `Content-Type: application/json` and this identical body:

   ```json
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
     "cardTypeId": 1,
     "buyer": "alice",
     "items": [
       { "id": "1", "productId": 28, "productName": "Alpine Peak Down Jacket", "unitPrice": 249.99, "oldUnitPrice": 249.99, "quantity": 1, "pictureUrl": null }
     ]
   }
   ```

2. `GET /api/orders?api-version=1.0` as `alice`.

## Expected result

- At least one of the two requests in step 1 responds `200 OK`.
- Step 2 responds `200 OK` with exactly one order, whose `total` is `249.99`.
