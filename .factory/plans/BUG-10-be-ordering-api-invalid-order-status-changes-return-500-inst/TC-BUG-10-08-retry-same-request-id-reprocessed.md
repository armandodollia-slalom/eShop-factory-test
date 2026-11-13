---
id: TC-BUG-10-08
type: sad
sad-path: conflict
layer: functional
covers: ["Decisions: idempotency request record is rolled back with the exception"]
priority: P2
---

# TC-BUG-10-08: Retrying a rejected cancel with the same request id is processed again, not treated as a duplicate

## Why

- Documented behavior change: the idempotency record is rolled back, so the retry must reach the domain rule again and return 409 rather than a silent 200. Ordering.API functional test (OrderingApiTests) with an order seeded directly in the test Postgres database; request sent with a valid bearer identity.

## Preconditions

- An order with Id 5 in status Shipped exists.

## Steps

1. `PUT /api/orders/cancel?api-version=1.0` with `x-requestid: <guid G>`, body `{"orderNumber": 5}`.
2. Repeat the identical request with the same `x-requestid: <guid G>`.

## Expected result

- Both responses are 409 with the same `detail`.
- Neither response is 200.
