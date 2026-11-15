---
id: TC-ORDD-1-09
type: sad
sad-path: ownership
layer: functional
covers: ["AC4: none of alice's order appears to bob", "Code map: GetOrderAsync(id, userId) scoped to the buyer, OrdersApi returns 404"]
priority: P1
---

# TC-ORDD-1-09: Ordering API refuses another buyer's order with 404

## Why

- The page's ownership guarantee rests on `GET /api/orders/{orderId}` returning nothing for another buyer's order; any client (not only the WebApp) could call it with a guessed id. A functional test against the real Postgres pins the buyer scoping cheaply and directly. The owner-gets-200 step proves the 404 is due to ownership, not a broken query.

## Preconditions

- `tests/Ordering.FunctionalTests` fixture (Ordering.API in-process, real Postgres).
- An order exists whose buyer `IdentityGuid` is alice's user id `50ddac7e-9b69-4d68-a91b-25100ef2e403`; its id is `<aliceOrderId>` (created through the fixture as alice).
- Requests authenticate as the user whose `sub` claim is the given id (the fixture's test auth).

## Steps

1. As alice (`sub` `50ddac7e-9b69-4d68-a91b-25100ef2e403`): `GET /api/orders/<aliceOrderId>?api-version=1.0`.
2. As bob (`sub` `bc8b0071-21af-41ab-b1d2-15c4efc368df`): `GET /api/orders/<aliceOrderId>?api-version=1.0`.

## Expected result

- Step 1 returns `200` with `orderNumber` equal to `<aliceOrderId>`.
- Step 2 returns `404`, and the response body does not contain alice's order's street, city or any of its item product names.
