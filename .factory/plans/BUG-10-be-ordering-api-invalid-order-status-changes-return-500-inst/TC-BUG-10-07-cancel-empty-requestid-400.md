---
id: TC-BUG-10-07
type: sad
sad-path: validation
layer: functional
covers: ["Implementation Notes: x-requestid check runs first"]
priority: P1
---

# TC-BUG-10-07: Cancel with an empty request id returns 400 before the order lookup

## Why

- The notes say the `x-requestid` check runs first. Using a non-existent order proves ordering: it must be 400, not 404.

## Preconditions

- No order with `OrderNumber` 999999 exists.

## Steps

1. `PUT /api/orders/cancel?api-version=1.0` with `x-requestid: 00000000-0000-0000-0000-000000000000` and body `{"orderNumber": 999999}`.

## Expected result

- Status `400`; body is the string "Empty GUID is not valid for request ID".
