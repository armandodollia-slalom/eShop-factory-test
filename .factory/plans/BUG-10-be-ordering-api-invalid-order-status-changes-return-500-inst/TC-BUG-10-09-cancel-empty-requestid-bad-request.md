---
id: TC-BUG-10-09
type: sad
sad-path: validation
layer: functional
covers: ["Code map: empty x-requestid 400 unchanged"]
priority: P2
---

# TC-BUG-10-09: Cancel with an empty request id still returns 400

## Why

- Regression guard: the new error mapping must not change the existing request-id check.

## Preconditions

- Ordering API in-process via WebApplicationFactory against the fixture's Postgres, caller authenticated as user alice (fixture's AutoAuthorizeMiddleware).
- An order with Id 5 owned by alice exists with status Shipped.

## Steps

1. `PUT /api/orders/cancel` with `x-requestid: 00000000-0000-0000-0000-000000000000` and body `{"orderNumber": 5}`.

## Expected result

- Status code is 400, body "Empty GUID is not valid for request ID".
