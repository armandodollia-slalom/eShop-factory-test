---
id: TC-BUG-10-10
type: happy
layer: functional
covers: ["Code map: 200 unchanged", "Outputs: Ok"]
priority: P1
---

# TC-BUG-10-10: Cancelling a Submitted order still returns 200

## Why

- Happy path must survive the exception-propagation change in IdentifiedCommandHandler.

## Preconditions

- Scenario `ordering-statuses` (new, `extends: default`) with orders owned by `alice`:
  - order 1: Submitted
  - order 2: Paid
  - order 3: Shipped
  - order 4: Cancelled
- Bearer token for alice.

## Steps

1. `PUT /api/orders/cancel`, new `x-requestid`, bearer alice, body `{"orderNumber": 1}`.
2. `GET /api/orders/1`.

## Expected result

- Step 1 status `200`.
- Step 2 returns order 1 with status `Cancelled`.
