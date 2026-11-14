---
id: TC-BUG-16-01
type: sad
sad-path: validation
layer: functional
covers: ["Expected: 400 \"99 is invalid event name\"", "Technical Notes: Enum.TryParse accepts any number"]
priority: P1
---

# TC-BUG-16-01: Numeric event "99" outside WebhookType is rejected

## Why

- This is the bug itself: Enum.TryParse accepted "99" and a type-99 subscription was stored. Functional layer is the cheapest that exercises validation, the endpoint and persistence against the real database.

## Preconditions

- Webhooks.API running in-process via `WebhooksApiFixture` with the test authentication middleware; request is sent as an authenticated user (`X-Test-User: owner-<guid>`) with `api-version=1.0`.
- Grant URL tester stub accepts any grant URL not ending in `/reject`.

## Steps

1. `POST /api/webhooks/` as the test user with body `{"url":"https://receiver.test/webhook","grantUrl":"https://receiver.test/check","token":"secret","event":"99"}`.
2. `GET /api/webhooks/` as the same user.

## Expected result

- Step 1 returns `400 BadRequest` and the response body contains `99 is invalid event name`.
- Step 2 contains no subscription for this user (no row stored with any `Type`); nothing was created.
