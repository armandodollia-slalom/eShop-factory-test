---
id: TC-BUG-10-10
type: sad
sad-path: validation
layer: functional
covers: ["Implementation Notes: empty x-requestid unchanged"]
priority: P3
---

# TC-BUG-10-10: Ship with an empty x-requestid still returns 400

## Why

- Regression guard for the ship endpoint (`ShipWithEmptyGuidFails`).

## Preconditions

- Order 6 `Paid`.

## Steps

1. `PUT /api/orders/ship` with `x-requestid: 00000000-0000-0000-0000-000000000000` and body `{"orderNumber": 6}`.

## Expected result

- Status is `400`.
- Body is `Empty GUID is not valid for request ID`.
- Order 6 still `Paid`.
