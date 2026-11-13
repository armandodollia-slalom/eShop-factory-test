---
id: TC-BUG-10-10
type: happy
layer: functional
covers: ["Valid ship still succeeds (regression guard)"]
priority: P1
---

# TC-BUG-10-10: Shipping a Paid order still returns 200 and ships it

## Why

- Guards the valid ship path after the same changes.

## Preconditions

- An order N exists with status `Paid`.

## Steps

1. `PUT /api/orders/ship?api-version=1.0` with `x-requestid: <new guid>` and body `{"orderNumber": N}`.
2. `GET /api/orders/N`.

## Expected result

- Step 1: status `200`.
- Step 2: order N has status `shipped`.
