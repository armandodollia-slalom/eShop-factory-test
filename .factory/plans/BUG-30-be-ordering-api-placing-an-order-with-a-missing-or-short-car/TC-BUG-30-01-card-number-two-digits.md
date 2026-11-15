---
id: TC-BUG-30-01
type: sad
sad-path: validation
layer: functional
covers: ["Steps to Reproduce: step 2 (cardNumber \"12\")", "Expected: 400 validation problem naming the card number", "Expected: no order is created"]
priority: P1
---

# TC-BUG-30-01: Order with card number "12" is rejected with a CardNumber validation problem

## Why

- This is the reported repro (step 2): "12" made the masking throw and returned 500. Functional is the cheapest layer that runs the real minimal-API binding, the endpoint and the ordering database, so it can also prove no order was persisted.

## Preconditions

- Ordering.API runs in-process through `OrderingApiFixture` (`tests/Ordering.FunctionalTests`) against its Postgres; the fixture's auto-authorize middleware supplies the caller identity `9e3163b9-1ae6-4652-9dc6-7898ab7b7a00` (stands in for `bob` on the test stack); requests carry `api-version=1.0`.
- Card types are seeded (id `2` = `Visa`).
- Before the request, `GET /api/orders?api-version=1.0` returns 200; record the length of the returned array as `N`.

## Steps

1. `POST /api/orders?api-version=1.0` with header `x-requestid: 0b6f6a52-3d0e-4c8e-9f41-5a2d7c1e8b30`, `Content-Type: application/json` and this body (`cardNumber` is `"12"`):

   ```json
   {
     "userId": "9e3163b9-1ae6-4652-9dc6-7898ab7b7a00",
     "userName": "bob",
     "city": "Redmond",
     "street": "15703 NE 61st Ct",
     "state": "WA",
     "country": "U.S.",
     "zipCode": "98052",
     "cardNumber": "12",
     "cardHolderName": "Bob Smith",
     "cardExpiration": "2030-12-31T00:00:00Z",
     "cardSecurityNumber": "123",
     "cardTypeId": 2,
     "buyer": "bob",
     "items": [
       { "id": "1", "productId": 99, "productName": "Adventurer GPS Watch", "unitPrice": 10.00, "oldUnitPrice": 10.00, "quantity": 1, "pictureUrl": null }
     ]
   }
   ```

2. `GET /api/orders?api-version=1.0`.

## Expected result

- Step 1 responds `400 Bad Request` (not `500`).
- Step 1's `Content-Type` is `application/problem+json`.
- Step 1's body has an `errors` object containing the key `CardNumber` whose value is an array with at least one non-empty string.
- Step 2 responds 200 and its array length is still `N`: no order was created for the caller.
