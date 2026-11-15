---
id: TC-BUG-30-03
type: sad
sad-path: validation
layer: functional
covers: ["Steps to Reproduce: step 3 (no cardNumber field)", "Expected: 400 validation problem naming the card number", "Expected: no order is created"]
priority: P1
---

# TC-BUG-30-03: Order without a cardNumber field is rejected with a CardNumber validation problem

## Why

- Step 3 of the repro requires the request with no `cardNumber` property at all; the property binds as null, a different code path from an empty string (a null dereference rather than a short substring). Same layer reasoning as TC-BUG-30-01.

## Preconditions

- Ordering.API runs in-process through `OrderingApiFixture` (`tests/Ordering.FunctionalTests`) against its Postgres; the fixture's auto-authorize middleware supplies the caller identity `9e3163b9-1ae6-4652-9dc6-7898ab7b7a00` (stands in for `bob` on the test stack); requests carry `api-version=1.0`.
- Card types are seeded (id `2` = `Visa`).
- Before the request, `GET /api/orders?api-version=1.0` returns 200; record the length of the returned array as `N`.

## Steps

1. `POST /api/orders?api-version=1.0` with header `x-requestid: 0b6f6a52-3d0e-4c8e-9f41-5a2d7c1e8b33`, `Content-Type: application/json` and this body (no `cardNumber` property):

   ```json
   {
     "userId": "9e3163b9-1ae6-4652-9dc6-7898ab7b7a00",
     "userName": "bob",
     "city": "Redmond",
     "street": "15703 NE 61st Ct",
     "state": "WA",
     "country": "U.S.",
     "zipCode": "98052",
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
