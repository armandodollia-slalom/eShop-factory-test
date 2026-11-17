---
id: TC-ORDST-1-05
type: sad
sad-path: ownership
layer: e2e
covers: ["AC5: returns only that shopper's orders in that status"]
priority: P1
---

# TC-ORDST-1-05: bob's GET /api/orders?status=Paid does not return alice's Paid orders

## Why

- AC5 limits the result to the caller's own orders. A new filtered query path is exactly where the buyer condition can be dropped (filtering by status alone), leaking other shoppers' orders. Runs on the test stack with real orders owned by alice.

## Preconditions

- Test stack running with scenario `ordst-1` (alice owns Paid orders 101 and 102; bob has no orders).
- A bearer token for `bob` / `Pass123$`.

## Steps

1. `GET /api/orders?api-version=1.0&status=Paid` with bob's token.

## Expected result

- `200 OK` with body `[]`.
- Neither order `101` nor `102` appears in the body.
