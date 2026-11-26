---
id: TC-BUG-10-13
type: sad
sad-path: conflict
layer: functional
covers: ["Implementation Notes: duplicate request id -> 200"]
priority: P2
---

# TC-BUG-10-13: Repeating a successful cancel with the same x-requestid returns 200 and changes nothing

## Why

- Idempotency path must survive the change that records request ids only on success.

## Preconditions

- Dedicated order 10 owned by alice with status `Submitted` (no other case touches order 10); request id G is a fresh guid.

## Steps

1. `PUT /api/orders/cancel` with `x-requestid: G`, body `{"orderNumber": 10}`.
2. Repeat the identical request.

## Expected result

- Both responses are `200`.
- `GET /api/orders/10` after step 1 and after step 2 returns status `Cancelled` both times (the repeat does not change or fail the order).
