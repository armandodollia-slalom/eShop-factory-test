---
id: TC-BUG-10-07
type: sad
sad-path: validation
layer: functional
covers: ["Implementation Notes: validation failures map to 400"]
priority: P2
---

# TC-BUG-10-07: Cancel with orderNumber 0 returns 400 with the validation message

## Why

- The command validator rejects 0 (`No orderId found`); the validator failure arrives wrapped in `OrderingDomainException` and must be 400, not 409.

## Preconditions

- Any authenticated caller.

## Steps

1. `PUT /api/orders/cancel` with `x-requestid: <new guid>` and body `{"orderNumber": 0}`.

## Expected result

- Status is `400`.
- `detail` contains `No orderId found`.
