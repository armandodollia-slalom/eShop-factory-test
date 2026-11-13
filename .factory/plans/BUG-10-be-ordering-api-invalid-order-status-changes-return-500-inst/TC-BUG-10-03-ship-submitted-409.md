---
id: TC-BUG-10-03
type: sad
sad-path: conflict
layer: functional
covers: ["Technical Notes: SetShippedStatus rule violation","Acceptance: ship maps to 409"]
priority: P1
---

# TC-BUG-10-03: Shipping an order that is not Paid (Submitted) returns 409

## Why

- `ShipOrderAsync` had the same 500 mapping as cancel (OrdersApi.cs:74); separate endpoint, so it needs its own case.

## Preconditions

- Order 7 with status `Submitted`.

## Steps

1. `PUT /api/orders/ship` with `x-requestid: <new guid>` and body `{"orderNumber": 7}`.

## Expected result

- Status is `409`.
- `detail` is `Is not possible to change the order status from Submitted to Shipped.`.
- Order 7 still has status `Submitted`.
