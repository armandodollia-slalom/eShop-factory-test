---
id: TC-BUG-10-03
type: sad
sad-path: conflict
layer: functional
covers: ["Implementation Notes: Ship on an order that is not Paid -> 409", "Order.SetShippedStatus"]
priority: P1
---

# TC-BUG-10-03: Shipping an order that is not Paid returns 409

## Why

- `SetShippedStatus` only allows Paid. Ship is a separate endpoint from cancel and was equally mapped to 500, so it needs its own case.

## Preconditions

- An order N exists with status `Submitted`.

## Steps

1. `PUT /api/orders/ship?api-version=1.0` with `x-requestid: <new guid>` and body `{"orderNumber": N}`.
2. `GET /api/orders/N`.

## Expected result

- Step 1: status `409`; `ProblemDetails.title` "Invalid order status change"; `detail` "Is not possible to change the order status from Submitted to Shipped."
- Step 2: order N still has status `submitted`.
