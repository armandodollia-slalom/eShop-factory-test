---
id: TC-BUG-10-12
type: happy
layer: functional
covers: ["Code map: 200 unchanged"]
priority: P1
---

# TC-BUG-10-12: Shipping a Paid order still returns 200 and sets status Shipped

## Why

- Success path of ship must be unaffected by the new exception mapping.

## Preconditions

- Ordering API in-process via WebApplicationFactory against the fixture's Postgres, caller authenticated as user alice (fixture's AutoAuthorizeMiddleware).
- An order with Id 6 owned by alice exists with status Paid.

## Steps

1. `PUT /api/orders/ship` with a new `x-requestid` guid and body `{"orderNumber": 6}`.
2. `GET /api/orders/6`.

## Expected result

- Step 1 returns 200.
- Step 2 returns 200 and `status` is "shipped".
