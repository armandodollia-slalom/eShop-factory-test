---
id: TC-BUG-10-12
type: happy
layer: functional
covers: ["Implementation Notes: success -> 200"]
priority: P1
---

# TC-BUG-10-12: Shipping a Paid order succeeds with 200

## Why

- Success path for ship after the mapping change.

## Preconditions

- Dedicated order 9 owned by alice with status `Paid` (no other case touches order 9).

## Steps

1. `PUT /api/orders/ship` with `x-requestid: <new guid>` and body `{"orderNumber": 9}`.

## Expected result

- Status is `200`.
- `GET /api/orders/9` returns status `Shipped`.
