---
id: TC-BUG-10-02
type: sad
sad-path: conflict
layer: functional
covers: ["Technical Notes: SetCancelledStatus rule violation", "Outputs: 409"]
priority: P1
---

# TC-BUG-10-02: Cancelling a Paid order returns 409

## Why

- Order.SetCancelledStatus rejects Paid as well as Shipped; a separate case guards the second branch of the rule.

## Preconditions

- Scenario `ordering-statuses` (new, `extends: default`) with orders owned by `alice`:
  - order 1: Submitted
  - order 2: Paid
  - order 3: Shipped
  - order 4: Cancelled
- Bearer token for alice.

## Steps

1. `PUT /api/orders/cancel`, new `x-requestid`, bearer alice, body `{"orderNumber": 2}`.

## Expected result

- Status `409`; `ProblemDetails.detail` = "Is not possible to change the order status from Paid to Cancelled.".
- Order 2 is still Paid.
