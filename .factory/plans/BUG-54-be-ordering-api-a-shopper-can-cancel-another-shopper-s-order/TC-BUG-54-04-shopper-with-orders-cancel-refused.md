---
id: TC-BUG-54-04
type: sad
sad-path: ownership
layer: e2e
covers: ["Expected: step 3 is refused", "Expected: alice's order keeps the status it had"]
priority: P1
---

# TC-BUG-54-04: bob, who has an order of his own, cancelling alice's order is refused with 404 and alice's order stays Submitted

## Why

- The fix has two refusal paths: a caller with no buyer record and a caller whose buyer id differs from the order's. TC-BUG-54-05 covers the first; this case gives bob a buyer record so the buyer-id comparison itself is exercised. A shopper who has ordered before is the common real-world attacker.

## Preconditions

- Test stack running with scenario `default`; Ordering API tokens for `alice` and `bob`.
- bob has one order created with `POST /api/orders?api-version=1.0` as bob (so bob has a buyer record); its number is `B`.
- alice has one order created with `POST /api/orders?api-version=1.0` as alice; its number is `A`; status `Submitted`.

## Steps

1. As bob: `PUT /api/orders/cancel?api-version=1.0` with a new `x-requestid`, `Authorization: Bearer <bob token>`, body `{ "orderNumber": A }`.
2. As alice: `GET /api/orders/A?api-version=1.0`.

## Expected result

- Step 1 answers `404 Not Found` with an empty body.
- Step 2 answers `200 OK` with `status` = `Submitted`.
