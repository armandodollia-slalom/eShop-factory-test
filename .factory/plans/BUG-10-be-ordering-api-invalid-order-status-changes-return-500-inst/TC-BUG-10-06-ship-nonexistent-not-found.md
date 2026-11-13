---
id: TC-BUG-10-06
type: sad
sad-path: not-found
layer: functional
covers: ["Suggested fix: 404 when the order does not exist"]
priority: P1
---

# TC-BUG-10-06: Shipping a nonexistent order returns 404

## Why

- Same as cancel, for the ship endpoint (existing ShipNonExistentOrderFails asserts 500 and must change).

## Preconditions

- Ordering API in-process via WebApplicationFactory against the fixture's Postgres, caller authenticated as user alice (fixture's AutoAuthorizeMiddleware).
- No order with Id 999999 exists.

## Steps

1. `PUT /api/orders/ship` with a new `x-requestid` guid and body `{"orderNumber": 999999}`.

## Expected result

- Status code is 404.
