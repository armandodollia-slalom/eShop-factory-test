---
id: TC-BUG-10-08
type: sad
sad-path: validation
layer: functional
covers: ["Decisions: validation OrderingDomainException returns 400"]
priority: P3
---

# TC-BUG-10-08: Ship with order number 0 returns 400 with the validation message

## Why

- Same mapping on the ship endpoint, which has its own validator.

## Preconditions

- Ordering API in-process via WebApplicationFactory against the fixture's Postgres, caller authenticated as user alice (fixture's AutoAuthorizeMiddleware).

## Steps

1. `PUT /api/orders/ship` with a new `x-requestid` guid and body `{"orderNumber": 0}`.

## Expected result

- Status code is 400.
- Body is a non-empty string (the validation message from the existing ship command validator; the story does not fix the text).
- Not 409.
