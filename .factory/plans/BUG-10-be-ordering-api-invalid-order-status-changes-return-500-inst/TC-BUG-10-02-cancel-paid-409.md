---
id: TC-BUG-10-02
type: sad
sad-path: conflict
layer: functional
covers: ["Technical Notes: SetCancelledStatus rule violation","Expected: 409"]
priority: P1
---

# TC-BUG-10-02: Cancelling a Paid order returns 409

## Why

- `SetCancelledStatus` rejects both Paid and Shipped; the Paid branch is a separate condition that the story's example does not exercise.

## Preconditions

- Order 6 owned by alice with status `Paid`.

## Steps

1. `PUT /api/orders/cancel` with `x-requestid: <new guid>` and body `{"orderNumber": 6}`.

## Expected result

- Status is `409`.
- `detail` is `Is not possible to change the order status from Paid to Cancelled.`.
- Order 6 still has status `Paid`.
