---
id: TC-BUG-10-09
type: sad
sad-path: validation
layer: functional
covers: ["Implementation Notes: empty x-requestid unchanged"]
priority: P3
---

# TC-BUG-10-09: Cancel with an empty x-requestid still returns 400

## Why

- Regression guard: the early request-id check must still run before any rule mapping.

## Preconditions

- Order 5 `Shipped`.

## Steps

1. `PUT /api/orders/cancel` with `x-requestid: 00000000-0000-0000-0000-000000000000` and body `{"orderNumber": 5}`.

## Expected result

- Status is `400`.
- Body is `Empty GUID is not valid for request ID`.
