---
id: TC-BUG-16-03
type: sad
sad-path: boundary
layer: functional
covers: ["Technical Notes: purely numeric input", "Expected: 400"]
priority: P1
---

# TC-BUG-16-03: Numeric event "4" (just above the last defined value) is rejected

## Why

- Boundary above the highest defined value (OrderPaid = 3); catches an off-by-one Enum.IsDefined/range check.

## Preconditions

- Webhooks.API running in-process via `WebhooksApiFixture` with the test authentication middleware; request is sent as an authenticated user (`X-Test-User: owner-<guid>`) with `api-version=1.0`.
- Grant URL tester stub accepts any grant URL not ending in `/reject`.

## Steps

1. `POST /api/webhooks/` as the test user with body `{"url":"https://receiver.test/webhook","grantUrl":"https://receiver.test/check","token":"secret","event":"4"}`.
2. `GET /api/webhooks/` as the same user.

## Expected result

- Step 1 returns `400 BadRequest` and the response body contains `4 is invalid event name`.
- Step 2 contains no subscription for this user (no row stored with any `Type`); nothing was created.
