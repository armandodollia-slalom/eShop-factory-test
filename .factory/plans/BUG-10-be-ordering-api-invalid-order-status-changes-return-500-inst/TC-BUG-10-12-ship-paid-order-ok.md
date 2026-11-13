---
id: TC-BUG-10-12
type: happy
layer: functional
covers: ["Valid transition still succeeds"]
priority: P1
---

# TC-BUG-10-12: Shipping a Paid order still returns 200 and sets Shipped

## Why

- Success path of the ship endpoint after the mapping change. Ordering.API functional test (OrderingApiTests) with an order seeded directly in the test Postgres database; request sent with a valid bearer identity.

## Preconditions

- An order with Id 10 in status Paid exists.

## Steps

1. `PUT /api/orders/ship?api-version=1.0` with a new `x-requestid`, body `{"orderNumber": 10}`.
2. `GET /api/orders/10?api-version=1.0`.

## Expected result

- Step 1 returns 200 with empty body.
- Step 2 returns 200 with `status` `shipped`.
