---
id: TC-BUG-54-07
type: happy
layer: e2e
covers: ["Expected: alice can still cancel her own order exactly as today", "Expected: after step 3, alice's order keeps the status it had"]
priority: P2
---

# TC-BUG-54-07: alice can still cancel her order after bob's refused attempt on it

## Why

- The ticket says that after step 3 alice can still cancel her own order. If the refused attempt left the order in a changed state (or a domain event half-applied), alice's later cancel would fail; this is the full reproduction followed by the owner's action, which needs the real stack.

## Preconditions

- Test stack running with scenario `default`; Ordering API tokens for `alice` and `bob` (bob has no orders).
- alice has one `Submitted` order created with `POST /api/orders?api-version=1.0`; its number is `A`.

## Steps

1. As bob: `PUT /api/orders/cancel?api-version=1.0` with header `x-requestid: <GUID g1>`, `Authorization: Bearer <bob token>`, body `{ "orderNumber": A }`.
2. As alice: `PUT /api/orders/cancel?api-version=1.0` with header `x-requestid: <new GUID g2, different from g1>`, `Authorization: Bearer <alice token>`, body `{ "orderNumber": A }`.
3. As alice: `GET /api/orders/A?api-version=1.0`.

## Expected result

- Step 1 answers `404 Not Found`.
- Step 2 answers `200 OK`.
- Step 3 answers `200 OK` with `status` = `Cancelled`.
