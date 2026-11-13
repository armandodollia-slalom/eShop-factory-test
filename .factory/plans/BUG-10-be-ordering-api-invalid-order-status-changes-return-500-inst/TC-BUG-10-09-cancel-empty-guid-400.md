---
id: TC-BUG-10-09
type: sad
sad-path: validation
layer: functional
covers: ["Existing behavior: empty x-requestid is 400"]
priority: P2
---

# TC-BUG-10-09: Cancel with an empty request id still returns 400

## Why

- Regression guard: the request-id check runs before the new exception mapping and must not change. Existing test CancelWithEmptyGuidFails covers it; keep it passing. Ordering.API functional test (OrderingApiTests) with an order seeded directly in the test Postgres database; request sent with a valid bearer identity.

## Preconditions

- Any order state.

## Steps

1. `PUT /api/orders/cancel?api-version=1.0` with `x-requestid: 00000000-0000-0000-0000-000000000000`, body `{"orderNumber": 1}`.

## Expected result

- Status code is 400.
- Body is `Empty GUID is not valid for request ID`.
