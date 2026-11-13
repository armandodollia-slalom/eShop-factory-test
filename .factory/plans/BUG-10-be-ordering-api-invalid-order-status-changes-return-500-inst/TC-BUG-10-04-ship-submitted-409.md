---
id: TC-BUG-10-04
type: sad
sad-path: conflict
layer: functional
covers: ["Technical Notes: SetShippedStatus only valid from Paid"]
priority: P2
---

# TC-BUG-10-04: Shipping an order that is not Paid (Submitted) returns 409

## Why

- Ship is only allowed from Paid; a non-terminal, non-Paid status checks the rule is not limited to Cancelled orders.

## Preconditions

- Order 8 with status Submitted exists.

## Steps

1. `PUT /api/orders/ship` with a new `x-requestid` guid and body `{"orderNumber": 8}`.

## Expected result

- HTTP status `409`; `detail` is "Is not possible to change the order status from Submitted to Shipped.".
- Order 8 is still Submitted.
