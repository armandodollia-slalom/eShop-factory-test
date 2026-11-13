---
id: TC-BUG-10-07
type: sad
sad-path: validation
layer: functional
covers: ["Decisions: validation OrderingDomainException returns 400"]
priority: P2
---

# TC-BUG-10-07: Cancel with order number 0 returns 400 with the validation message

## Why

- Validator failures also surface as OrderingDomainException; they must map to 400, not to the 409 of a status rule. Boundary of NotEmpty on OrderNumber.

## Preconditions

- Ordering API in-process via WebApplicationFactory against the fixture's Postgres, caller authenticated as user alice (fixture's AutoAuthorizeMiddleware).

## Steps

1. `PUT /api/orders/cancel` with a new `x-requestid` guid and body `{"orderNumber": 0}`.

## Expected result

- Status code is 400.
- Body is a non-empty string (the validation message from the existing cancel command validator; the story does not fix the text).
- Not 409.
