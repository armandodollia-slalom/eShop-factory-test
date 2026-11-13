---
id: TC-BUG-10-07
type: sad
sad-path: validation
layer: functional
covers: ["Decisions: validation OrderingDomainException returns 400 with validation messages"]
priority: P2
---

# TC-BUG-10-07: Cancelling with order number 0 returns 400 with the validation message

## Why

- ValidatorBehavior raises OrderingDomainException wrapping a ValidationException; it must map to 400, not the 409 used for rule violations.

## Preconditions

- None.

## Steps

1. `PUT /api/orders/cancel` with a new `x-requestid` guid and body `{"orderNumber": 0}`.

## Expected result

- HTTP status `400`.
- Body text contains "No orderId found".
- Status is not 409 or 500.
