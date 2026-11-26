---
id: TC-BUG-10-05
type: sad
sad-path: not-found
layer: functional
covers: ["Suggested fix: return 404 when the order does not exist"]
priority: P1
---

# TC-BUG-10-05: Cancelling a nonexistent order returns 404

## Why

- The failure path now distinguishes a missing order from a server fault. Replaces the stale expectation of 500 in `CancelNonExistentOrderFails`.

## Preconditions

- No order with number 99999.

## Steps

1. `PUT /api/orders/cancel` with `x-requestid: <new guid>` and body `{"orderNumber": 99999}`.

## Expected result

- Status is `404`.
- No order is created or changed.
