---
id: TC-BUG-10-09
type: happy
layer: functional
covers: ["Valid cancel still succeeds (regression guard for the new exception handling)"]
priority: P1
---

# TC-BUG-10-09: Cancelling a Submitted order still returns 200 and cancels it

## Why

- Guards that rethrowing domain exceptions and the new existence check did not break the valid path.

## Preconditions

- An order N exists with status `Submitted`.

## Steps

1. `PUT /api/orders/cancel?api-version=1.0` with `x-requestid: <new guid>` and body `{"orderNumber": N}`.
2. `GET /api/orders/N`.

## Expected result

- Step 1: status `200`.
- Step 2: order N has status `cancelled`.
