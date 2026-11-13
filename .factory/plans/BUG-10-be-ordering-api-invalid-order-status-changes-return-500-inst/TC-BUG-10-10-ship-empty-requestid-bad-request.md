---
id: TC-BUG-10-10
type: sad
sad-path: validation
layer: functional
covers: ["Code map: empty x-requestid 400 unchanged"]
priority: P3
---

# TC-BUG-10-10: Ship with an empty request id still returns 400

## Why

- Regression guard on the ship endpoint.

## Preconditions

- Ordering API in-process via WebApplicationFactory against the fixture's Postgres, caller authenticated as user alice (fixture's AutoAuthorizeMiddleware).

## Steps

1. `PUT /api/orders/ship` with `x-requestid: 00000000-0000-0000-0000-000000000000` and body `{"orderNumber": 7}`.

## Expected result

- Status code is 400, body "Empty GUID is not valid for request ID".
