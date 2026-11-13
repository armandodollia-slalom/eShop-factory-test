---
id: TC-BUG-10-11
type: happy
layer: functional
covers: ["Valid transition still succeeds"]
priority: P1
---

# TC-BUG-10-11: Cancelling a cancellable order still returns 200 and sets Cancelled

## Why

- Guards that the new catch/404 mapping did not break the success path. Ordering.API functional test (OrderingApiTests) with an order seeded directly in the test Postgres database; request sent with a valid bearer identity.

## Preconditions

- An order with Id 9 in status AwaitingValidation exists.

## Steps

1. `PUT /api/orders/cancel?api-version=1.0` with a new `x-requestid`, body `{"orderNumber": 9}`.
2. `GET /api/orders/9?api-version=1.0`.

## Expected result

- Step 1 returns 200 with empty body.
- Step 2 returns 200 with `status` `cancelled`.
