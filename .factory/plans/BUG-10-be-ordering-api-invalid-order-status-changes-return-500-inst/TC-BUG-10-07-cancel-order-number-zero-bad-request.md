---
id: TC-BUG-10-07
type: sad
sad-path: validation
layer: functional
covers: ["Implementation Notes: command validation OrderingDomainException returns 400"]
priority: P2
---

# TC-BUG-10-07: Cancel with order number 0 fails command validation and returns 400

## Why

- Validation failures also surface as OrderingDomainException and must be 400, not the 409 used for status rules.

## Preconditions

- Bearer token for alice.

## Steps

1. `PUT /api/orders/cancel`, new `x-requestid`, bearer alice, body `{"orderNumber": 0}`.

## Expected result

- Status `400` (not 409, not 500).
- Body is a string containing the validation message.
