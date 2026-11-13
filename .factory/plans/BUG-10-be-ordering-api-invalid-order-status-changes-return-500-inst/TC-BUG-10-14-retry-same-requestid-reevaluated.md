---
id: TC-BUG-10-14
type: sad
sad-path: conflict
layer: functional
covers: ["Deviations: transaction rolls back on rule violation, retry evaluated again"]
priority: P3
---

# TC-BUG-10-14: Retrying a rejected cancel with the same request id returns 409 again

## Why

- The idempotency ClientRequest row now rolls back on a rule violation; a retry must be evaluated again, not reported as a duplicate success.

## Preconditions

- Ordering API in-process via WebApplicationFactory against the fixture's Postgres, caller authenticated as user alice (fixture's AutoAuthorizeMiddleware).
- An order with Id 5 owned by alice exists with status Shipped.

## Steps

1. `PUT /api/orders/cancel` with `x-requestid: <guid G>` and body `{"orderNumber": 5}`.
2. Repeat the identical request with the same guid G.

## Expected result

- Both responses are 409 with `detail` "Is not possible to change the order status from Shipped to Cancelled.".
