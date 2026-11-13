---
id: TC-BUG-10-07
type: sad
sad-path: conflict
layer: functional
covers: ["Decisions: exception escapes outer transaction and rolls back"]
priority: P2
---

# TC-BUG-10-07: A rejected cancel leaves the order status unchanged

## Why

- Protects against the rolled-back transaction leaking a partial state change when the exception now escapes. Ordering.API functional test (OrderingApiTests) with an order seeded directly in the test Postgres database; request sent with a valid bearer identity.

## Preconditions

- An order with Id 5 in status Shipped exists.

## Steps

1. `PUT /api/orders/cancel?api-version=1.0` with a new `x-requestid`, body `{"orderNumber": 5}`.
2. `GET /api/orders/5?api-version=1.0`.

## Expected result

- Step 1 returns 409.
- Step 2 returns 200 with `status` `shipped`.
