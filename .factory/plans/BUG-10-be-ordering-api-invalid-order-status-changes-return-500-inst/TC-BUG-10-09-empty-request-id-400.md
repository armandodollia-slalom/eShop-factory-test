---
id: TC-BUG-10-09
type: sad
sad-path: validation
layer: functional
covers: ["Code map: empty x-requestid 400 unchanged"]
priority: P2
---

# TC-BUG-10-09: Empty x-requestid still returns 400 on cancel and ship

## Why

- Regression guard: the story states the empty request id 400 is unchanged by the refactor of the result type. The existing CancelWithEmptyGuidFails and ShipWithEmptyGuidFails tests cover this and must keep passing.

## Preconditions

- Any order number in the body (e.g. 5).

## Steps

1. `PUT /api/orders/cancel` with `x-requestid: 00000000-0000-0000-0000-000000000000` and body `{"orderNumber": 5}`.
2. `PUT /api/orders/ship` with the same header and body.

## Expected result

- Both responses are `400` with body "Empty GUID is not valid for request ID".
- Order 5 is unchanged.
