---
id: TC-BUG-10-03
type: sad
sad-path: conflict
layer: functional
covers: ["Technical Notes: SetShippedStatus", "Decisions: invalid transition returns 409 (ship)"]
priority: P1
---

# TC-BUG-10-03: Shipping a Cancelled order returns 409

## Why

- The ship endpoint shares the mapping code with cancel; the story says cancel/ship are both mapped to 500 today, so ship needs its own case.

## Preconditions

- Order 7 with status Cancelled exists.

## Steps

1. `PUT /api/orders/ship` with a new `x-requestid` guid and body `{"orderNumber": 7}`.

## Expected result

- HTTP status `409`; `ProblemDetails.detail` is "Is not possible to change the order status from Cancelled to Shipped.".
- Order 7 is still Cancelled.
