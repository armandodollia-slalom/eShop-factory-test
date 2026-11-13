---
id: TC-BUG-10-09
type: sad
sad-path: validation
layer: functional
covers: ["Code map: empty x-requestid 400 unchanged"]
priority: P2
---

# TC-BUG-10-09: Ship with empty x-requestid still returns 400

## Why

- Regression guard for the ship endpoint (ShipWithEmptyGuidFails).

## Preconditions

- Bearer token for alice.

## Steps

1. `PUT /api/orders/ship` with the empty guid `x-requestid`, body `{"orderNumber": 2}`.

## Expected result

- Status `400`, body "Empty GUID is not valid for request ID".
