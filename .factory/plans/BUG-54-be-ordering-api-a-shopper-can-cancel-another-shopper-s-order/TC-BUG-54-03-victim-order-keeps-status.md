---
id: TC-BUG-54-03
type: sad
sad-path: ownership
layer: e2e
covers: ["Steps to Reproduce 4", "Expected: after step 3, alice's order keeps the status it had"]
priority: P1
---

# TC-BUG-54-03: alice's order is still Submitted after bob's refused cancel

## Why

- The bug's damage was alice's order becoming Cancelled. A refusal status alone does not prove nothing was saved (the handler could cancel and then throw), so the persisted state is checked separately from alice's side.

## Preconditions

- Test stack running with scenario `default`; Ordering API tokens for `alice` and `bob` (bob has no orders).
- alice has one order created with `POST /api/orders?api-version=1.0`; its number is `A`; `GET /api/orders/A?api-version=1.0` as alice returns `status` = `Submitted` immediately before step 1.

## Steps

1. As bob: `PUT /api/orders/cancel?api-version=1.0` with a new `x-requestid`, `Authorization: Bearer <bob token>`, body `{ "orderNumber": A }`.
2. As alice: `GET /api/orders/A?api-version=1.0`.
3. As alice: `GET /api/orders?api-version=1.0`.

## Expected result

- Step 1 answers `404 Not Found`.
- Step 2 answers `200 OK` with `status` = `Submitted` (not `Cancelled`) and a `description` that is not "The order was cancelled.".
- Step 3 lists order A with `status` = `Submitted`.
