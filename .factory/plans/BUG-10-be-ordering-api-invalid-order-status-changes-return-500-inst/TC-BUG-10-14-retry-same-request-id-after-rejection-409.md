---
id: TC-BUG-10-14
type: sad
sad-path: conflict
layer: functional
covers: ["Implementation Notes: retry after a failed cancel/ship"]
priority: P1
---

# TC-BUG-10-14: Retrying a rejected cancel with the same x-requestid returns 409 again, not a false 200

## Why

- Risk: if the request id were recorded on failure, the retry would hit the duplicate path and report success for a cancel that never happened.

## Preconditions

- Order 5 `Shipped`; request id G is a fresh guid.

## Steps

1. `PUT /api/orders/cancel` with `x-requestid: G`, body `{"orderNumber": 5}`.
2. Repeat the identical request.

## Expected result

- Both responses are `409`.
- Order 5 still `Shipped`.
