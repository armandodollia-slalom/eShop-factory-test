---
id: TC-BUG-10-12
type: sad
sad-path: conflict
layer: functional
covers: ["Deviations: transaction rolls back, retry with same request id is evaluated again"]
priority: P2
---

# TC-BUG-10-12: Retrying a rejected cancel with the same x-requestid is re-evaluated (409 again)

## Why

- The deviation makes the idempotency ClientRequest row roll back on a rule violation; if it persisted, the retry would be treated as a duplicate and could return 200 or 500.

## Preconditions

- Scenario `ordering-statuses` (new, `extends: default`) with orders owned by `alice`:
  - order 1: Submitted
  - order 2: Paid
  - order 3: Shipped
  - order 4: Cancelled
- Bearer token for alice.

## Steps

1. `PUT /api/orders/cancel` with `x-requestid: G` (a fixed new guid), body `{"orderNumber": 3}`.
2. Repeat the identical request with the same `G`.

## Expected result

- Both responses are `409` with the same `detail`.
- Order 3 is still Shipped.
