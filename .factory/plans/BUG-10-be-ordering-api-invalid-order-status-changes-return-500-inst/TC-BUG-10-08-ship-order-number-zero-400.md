---
id: TC-BUG-10-08
type: sad
sad-path: validation
layer: functional
covers: ["Implementation Notes: validation failures map to 400"]
priority: P2
---

# TC-BUG-10-08: Ship with orderNumber 0 returns 400 with the validation message

## Why

- Mirror of the cancel validation case for the ship validator.

## Preconditions

- Any authenticated caller.

## Steps

1. `PUT /api/orders/ship` with `x-requestid: <new guid>` and body `{"orderNumber": 0}`.

## Expected result

- Status is `400`.
- `detail` contains `No orderId found`.
- Order 6 still has status `Paid`.
