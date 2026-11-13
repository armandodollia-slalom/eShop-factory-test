---
id: TC-BUG-10-08
type: sad
sad-path: validation
layer: functional
covers: ["Code map: empty x-requestid 400 unchanged"]
priority: P2
---

# TC-BUG-10-08: Cancel with empty x-requestid still returns 400

## Why

- Regression guard: the empty request id check precedes the new mapping. Covered today by CancelWithEmptyGuidFails.

## Preconditions

- Bearer token for alice.

## Steps

1. `PUT /api/orders/cancel` with `x-requestid: 00000000-0000-0000-0000-000000000000`, body `{"orderNumber": 1}`.

## Expected result

- Status `400`, body "Empty GUID is not valid for request ID".
