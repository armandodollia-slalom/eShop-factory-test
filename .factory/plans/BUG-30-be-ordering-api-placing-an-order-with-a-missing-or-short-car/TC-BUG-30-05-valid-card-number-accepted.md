---
id: TC-BUG-30-05
type: happy
layer: functional
covers: ["Expected: valid card number 4012888888881881 is accepted as it is today"]
priority: P1
---

# TC-BUG-30-05: Order with card number "4012888888881881" is accepted and creates an order

## Why

- The Expected section requires the fix to leave valid orders working; a guard placed or written wrongly could reject or break every order. Functional layer runs the real endpoint, MediatR pipeline and database, so it proves the order is actually persisted, not just that 200 is returned.

## Preconditions

- Ordering.API runs in-process through `OrderingApiFixture` (`tests/Ordering.FunctionalTests`) against its Postgres; the fixture's auto-authorize middleware supplies the caller identity `9e3163b9-1ae6-4652-9dc6-7898ab7b7a00` (stands in for `bob` on the test stack); requests carry `api-version=1.0`.
- Card types are seeded (id `2` = `Visa`).
- Before the request, `GET /api/orders?api-version=1.0` returns 200; record the length of the returned array as `N`.

## Steps

1. `POST /api/orders?api-version=1.0` with header `x-requestid: 7d2c9e41-6a8b-4f13-b5e0-2c94d1a7f683`, `Content-Type: application/json` and this body (`cardNumber` is `"4012888888881881"`):

   ```json
   {
     "userId": "9e3163b9-1ae6-4652-9dc6-7898ab7b7a00",
     "userName": "bob",
     "city": "Redmond",
     "street": "15703 NE 61st Ct",
     "state": "WA",
     "country": "U.S.",
     "zipCode": "98052",
     "cardNumber": "4012888888881881",
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

- Step 1 responds `200 OK`.
- Step 2 responds 200 and its array length is `N + 1`.
- Step 2 contains an entry that was not in the pre-request list, with `total` `10`.
