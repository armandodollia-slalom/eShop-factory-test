---
id: TC-BUG-10-02
type: sad
sad-path: conflict
layer: functional
covers: ["Implementation Notes: Cancel on a Paid or Shipped order -> 409", "Order.SetCancelledStatus"]
priority: P1
---

# TC-BUG-10-02: Cancelling a Paid order returns 409

## Why

- `SetCancelledStatus` rejects both Paid and Shipped; Shipped is covered by TC-BUG-10-01, so Paid is a separate branch of the same rule.

## Preconditions

- An order N exists with status `Paid`.

## Steps

1. `PUT /api/orders/cancel?api-version=1.0` with `x-requestid: <new guid>` and body `{"orderNumber": N}`.
2. `GET /api/orders/N`.

## Expected result

- Step 1: status `409`; `ProblemDetails.detail` is "Is not possible to change the order status from Paid to Cancelled."
- Step 2: order N still has status `paid`.
