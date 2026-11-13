---
id: TC-BUG-10-03
type: sad
sad-path: conflict
layer: functional
covers: ["Technical Notes: SetShippedStatus rule violation", "Outputs: 409"]
priority: P1
---

# TC-BUG-10-03: Shipping a Submitted order returns 409

## Why

- The ship endpoint has the same 500 mapping defect (OrdersApi ship path); shipping is only allowed from Paid.

## Preconditions

- Scenario `ordering-statuses` (new, `extends: default`) with orders owned by `alice`:
  - order 1: Submitted
  - order 2: Paid
  - order 3: Shipped
  - order 4: Cancelled
- Bearer token for alice.

## Steps

1. `PUT /api/orders/ship`, new `x-requestid`, bearer alice, body `{"orderNumber": 1}`.

## Expected result

- Status `409`; `ProblemDetails.detail` = "Is not possible to change the order status from Submitted to Shipped.".
- Order 1 is still Submitted.
