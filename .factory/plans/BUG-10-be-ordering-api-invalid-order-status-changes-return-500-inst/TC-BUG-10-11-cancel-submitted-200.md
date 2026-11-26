---
id: TC-BUG-10-11
type: happy
layer: functional
covers: ["Implementation Notes: success -> 200"]
priority: P1
---

# TC-BUG-10-11: Cancelling a Submitted order succeeds with 200

## Why

- Proves the new exception mapping does not break the success path.

## Preconditions

- Dedicated order 8 owned by alice with status `Submitted` (no other case touches order 8).

## Steps

1. `PUT /api/orders/cancel` with `x-requestid: <new guid>` and body `{"orderNumber": 8}`.

## Expected result

- Status is `200`.
- `GET /api/orders/8` returns status `Cancelled`.
