---
id: TC-BUG-16-02
type: sad
sad-path: boundary
layer: functional
covers: ["Technical Notes: purely numeric input", "Expected: 400"]
priority: P1
---

# TC-BUG-16-02: Numeric event "0" (just below the first defined value) is rejected

## Why

- Boundary below WebhookType values (1..3); 0 is what a default/unset enum would parse to, so a regression would persist a meaningless type.

## Preconditions

- Webhooks.API running in-process via `WebhooksApiFixture` with the test authentication middleware; request is sent as an authenticated user (`X-Test-User: owner-<guid>`) with `api-version=1.0`.
- Grant URL tester stub accepts any grant URL not ending in `/reject`.

## Steps

1. `POST /api/webhooks/` as the test user with body `{"url":"https://receiver.test/webhook","grantUrl":"https://receiver.test/check","token":"secret","event":"0"}`.
2. `GET /api/webhooks/` as the same user.

## Expected result

- Step 1 returns `400 BadRequest` and the response body contains `0 is invalid event name`.
- Step 2 contains no subscription for this user (no row stored with any `Type`); nothing was created.
