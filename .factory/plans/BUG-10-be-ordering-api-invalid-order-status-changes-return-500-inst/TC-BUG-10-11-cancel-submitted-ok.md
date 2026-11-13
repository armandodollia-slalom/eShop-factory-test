---
id: TC-BUG-10-11
type: happy
layer: functional
covers: ["Code map: 200 unchanged"]
priority: P1
---

# TC-BUG-10-11: Cancelling a Submitted order still returns 200 and sets status Cancelled

## Why

- The IdentifiedCommandHandler and endpoint were changed; the success path must be unaffected.

## Preconditions

- Ordering API in-process via WebApplicationFactory against the fixture's Postgres, caller authenticated as user alice (fixture's AutoAuthorizeMiddleware).
- An order with Id 8 owned by alice exists with status Submitted.

## Steps

1. `PUT /api/orders/cancel` with a new `x-requestid` guid and body `{"orderNumber": 8}`.
2. `GET /api/orders/8`.

## Expected result

- Step 1 returns 200 with an empty body.
- Step 2 returns 200 and `status` is "cancelled".
