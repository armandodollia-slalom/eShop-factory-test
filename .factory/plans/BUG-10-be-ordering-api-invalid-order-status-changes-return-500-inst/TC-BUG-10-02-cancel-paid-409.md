---
id: TC-BUG-10-02
type: sad
sad-path: conflict
layer: functional
covers: ["Decisions: invalid transition returns 409", "Technical Notes: SetCancelledStatus"]
priority: P2
---

# TC-BUG-10-02: Cancelling a Paid order returns 409

## Why

- SetCancelledStatus rejects both Paid and Shipped; the Paid branch is a distinct condition that could regress separately.

## Preconditions

- Order 6 with status Paid exists.

## Steps

1. `PUT /api/orders/cancel` with a new `x-requestid` guid and body `{"orderNumber": 6}`.

## Expected result

- HTTP status `409`; `detail` is "Is not possible to change the order status from Paid to Cancelled.".
- Order 6 is still Paid.
