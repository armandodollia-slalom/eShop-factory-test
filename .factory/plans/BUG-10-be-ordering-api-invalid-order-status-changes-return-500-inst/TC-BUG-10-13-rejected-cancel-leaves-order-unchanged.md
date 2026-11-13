---
id: TC-BUG-10-13
type: sad
sad-path: conflict
layer: functional
covers: ["Technical Notes: rule violation, not a server fault"]
priority: P2
---

# TC-BUG-10-13: A rejected cancel leaves the Shipped order unchanged

## Why

- A 409 must not partially persist state; protects against the transaction committing despite the exception.

## Preconditions

- Ordering API in-process via WebApplicationFactory against the fixture's Postgres, caller authenticated as user alice (fixture's AutoAuthorizeMiddleware).
- An order with Id 5 owned by alice exists with status Shipped.

## Steps

1. `PUT /api/orders/cancel` with a new `x-requestid` guid and body `{"orderNumber": 5}` (409).
2. `GET /api/orders/5`.

## Expected result

- Step 1 returns 409.
- Step 2 returns 200 and `status` is "shipped".
