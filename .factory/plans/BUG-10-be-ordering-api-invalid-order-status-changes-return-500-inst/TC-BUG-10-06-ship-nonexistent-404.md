---
id: TC-BUG-10-06
type: sad
sad-path: not-found
layer: functional
covers: ["Decisions: nonexistent order returns 404 (ship)"]
priority: P1
---

# TC-BUG-10-06: Shipping a nonexistent order returns 404

## Why

- Same mapping as cancel but through the ship endpoint; the existing ShipNonExistentOrderFails test asserts 500 and must change.

## Preconditions

- No order with number 999999 exists.

## Steps

1. `PUT /api/orders/ship` with a new `x-requestid` guid and body `{"orderNumber": 999999}`.

## Expected result

- HTTP status `404`, not 500.
