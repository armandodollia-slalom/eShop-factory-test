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

- Covers the repeated-transition case (new request id, same target state), distinct from the not-Paid case and from duplicate request ids.

## Preconditions

- Order 5 with status `Shipped`.

## Steps

1. `PUT /api/orders/ship` with `x-requestid: <new guid>` and body `{"orderNumber": 5}`.

## Expected result

- Status is `409`.
- `detail` is `Is not possible to change the order status from Shipped to Shipped.`.
- Order 5 still `Shipped`.
