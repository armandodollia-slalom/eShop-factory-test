---
id: TC-BUG-10-11
type: happy
layer: functional
covers: ["Code map: 200 unchanged", "Outputs: Ok"]
priority: P1
---

# TC-BUG-10-11: Shipping a Paid order still returns 200

## Why

- Happy path for the ship endpoint after the change.

## Preconditions

- Scenario `ordering-statuses` (new, `extends: default`) with orders owned by `alice`:
  - order 1: Submitted
  - order 2: Paid
  - order 3: Shipped
  - order 4: Cancelled
- Bearer token for alice.

## Steps

1. `PUT /api/orders/ship`, new `x-requestid`, bearer alice, body `{"orderNumber": 2}`.
2. `GET /api/orders/2`.

## Expected result

- Step 1 status `200`.
- Step 2 returns order 2 with status `Shipped`.
