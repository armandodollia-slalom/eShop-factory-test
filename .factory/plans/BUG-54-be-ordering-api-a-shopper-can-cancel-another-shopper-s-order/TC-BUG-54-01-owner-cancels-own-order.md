---
id: TC-BUG-54-01
type: happy
layer: e2e
covers: ["Expected: alice can still cancel her own order exactly as today"]
priority: P1
---

# TC-BUG-54-01: alice cancels her own Submitted order: 200 and the order reads Cancelled

## Why

- The fix adds an ownership check to the cancel handler; if it compares the wrong ids (for example identity id against buyer id) the owner would be refused too. The ticket requires the owner's cancel to work exactly as before. It needs a saved order and a real token, which only the test stack provides.

## Preconditions

- Test stack running with scenario `default`.
- An Ordering API access token for `alice` (orders scope).
- alice has one order created with `POST /api/orders?api-version=1.0` (new `x-requestid`, one item of catalog item 99 "Adventurer GPS Watch", a valid card); `GET /api/orders?api-version=1.0` as alice lists it with status `Submitted`. Call its number `A`.

## Steps

1. As alice: `PUT /api/orders/cancel?api-version=1.0` with header `x-requestid: <new GUID>`, `Authorization: Bearer <alice token>`, body `{ "orderNumber": A }`.
2. As alice: `GET /api/orders/A?api-version=1.0`.

## Expected result

- Step 1 answers `200 OK`.
- Step 2 answers `200 OK` with `status` = `Cancelled` and `orderNumber` = A.
