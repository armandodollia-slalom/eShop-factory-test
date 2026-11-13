---
id: TC-BUG-10-15
type: sad
sad-path: not-found
layer: functional
covers: ["Implementation Notes: not-found can be retried with same request id"]
priority: P2
---

# TC-BUG-10-15: Retrying a cancel for a nonexistent order with the same x-requestid returns 404 both times

## Why

- Same false-200 risk as TC-BUG-10-14 on the not-found path.

## Preconditions

- No order 99999; request id G fresh.

## Steps

1. `PUT /api/orders/cancel` with `x-requestid: G`, body `{"orderNumber": 99999}`.
2. Repeat the identical request.

## Expected result

- Both responses are `404`.
