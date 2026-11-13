---
id: TC-BUG-10-08
type: sad
sad-path: validation
layer: functional
covers: ["Implementation Notes: x-requestid check runs first"]
priority: P2
---

# TC-BUG-10-08: Ship with an empty request id returns 400 before the order lookup

## Why

- Same ordering rule on the ship endpoint.

## Preconditions

- No order with `OrderNumber` 999999 exists.

## Steps

1. `PUT /api/orders/ship?api-version=1.0` with `x-requestid: 00000000-0000-0000-0000-000000000000` and body `{"orderNumber": 999999}`.

## Expected result

- Status `400`; body is the string "Empty GUID is not valid for request ID".
