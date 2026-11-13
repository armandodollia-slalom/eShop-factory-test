---
id: TC-BUG-10-10
type: sad
sad-path: validation
layer: functional
covers: ["Existing behavior: empty x-requestid is 400"]
priority: P2
---

# TC-BUG-10-10: Ship with an empty request id still returns 400

## Why

- Regression guard for the ship endpoint (existing test ShipWithEmptyGuidFails). Ordering.API functional test (OrderingApiTests) with an order seeded directly in the test Postgres database; request sent with a valid bearer identity.

## Preconditions

- Any order state.

## Steps

1. `PUT /api/orders/ship?api-version=1.0` with `x-requestid: 00000000-0000-0000-0000-000000000000`, body `{"orderNumber": 1}`.

## Expected result

- Status code is 400.
- Body is `Empty GUID is not valid for request ID`.
