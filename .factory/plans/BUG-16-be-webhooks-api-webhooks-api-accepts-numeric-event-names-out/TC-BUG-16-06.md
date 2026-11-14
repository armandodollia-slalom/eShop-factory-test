---
id: TC-BUG-16-06
type: sad
sad-path: validation
layer: functional
covers: ["Expected: 400 invalid event name", "Regression: non-numeric invalid names"]
priority: P2
---

# TC-BUG-16-06: Undefined non-numeric event name "NotAnEvent" is still rejected

## Why

- Guards against the fix regressing the existing rejection of unknown names.

## Preconditions

- Webhooks.API running in-process via `WebhooksApiFixture` with the test authentication middleware; request is sent as an authenticated user (`X-Test-User: owner-<guid>`) with `api-version=1.0`.
- Grant URL tester stub accepts any grant URL not ending in `/reject`.

## Steps

1. `POST /api/webhooks/` as the test user with body `{"url":"https://receiver.test/webhook","grantUrl":"https://receiver.test/check","token":"secret","event":"NotAnEvent"}`.
2. `GET /api/webhooks/` as the same user.

## Expected result

- Step 1 returns `400 BadRequest` and the response body contains `NotAnEvent is invalid event name`.
- Step 2 contains no subscription for this user (no row stored with any `Type`); nothing was created.
