---
id: TC-BUG-10-04
type: sad
sad-path: conflict
layer: functional
covers: ["Implementation Notes: Ship on an order that is not Paid -> 409"]
priority: P2
---

# TC-BUG-10-04: Shipping an already Shipped order returns 409

## Why

- Boundary of the "only Paid can ship" rule: the state after a successful ship must itself be rejected, not silently accepted.

## Preconditions

- An order N exists with status `Shipped`.

## Steps

1. `PUT /api/orders/ship?api-version=1.0` with `x-requestid: <new guid>` and body `{"orderNumber": N}`.

## Expected result

- Status `409`; `detail` "Is not possible to change the order status from Shipped to Shipped."; order N remains `shipped`.
