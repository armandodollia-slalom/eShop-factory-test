---
id: TC-BUG-10-06
type: sad
sad-path: not-found
layer: functional
covers: ["Suggested fix: return 404 when the order does not exist"]
priority: P1
---

# TC-BUG-10-06: Shipping a nonexistent order returns 404

## Why

- Same as cancel for the ship endpoint; replaces the stale 500 expectation in `ShipNonExistentOrderFails`.

## Preconditions

- No order with number 99999.

## Steps

1. `PUT /api/orders/ship` with `x-requestid: <new guid>` and body `{"orderNumber": 99999}`.

## Expected result

- Status is `404`.
