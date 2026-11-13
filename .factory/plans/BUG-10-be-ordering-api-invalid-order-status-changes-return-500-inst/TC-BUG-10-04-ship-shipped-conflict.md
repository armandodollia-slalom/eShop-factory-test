---
id: TC-BUG-10-04
type: sad
sad-path: conflict
layer: functional
covers: ["Technical Notes: SetShippedStatus rule violation"]
priority: P2
---

# TC-BUG-10-04: Shipping an already Shipped order returns 409

## Why

- A distinct non-Paid source status for the ship rule; re-shipping must not be a server error.

## Preconditions

- Scenario `ordering-statuses` (new, `extends: default`) with orders owned by `alice`:
  - order 1: Submitted
  - order 2: Paid
  - order 3: Shipped
  - order 4: Cancelled
- Bearer token for alice.

## Steps

1. `PUT /api/orders/ship`, new `x-requestid`, bearer alice, body `{"orderNumber": 3}`.

## Expected result

- Status `409`; `ProblemDetails.detail` = "Is not possible to change the order status from Shipped to Shipped.".
