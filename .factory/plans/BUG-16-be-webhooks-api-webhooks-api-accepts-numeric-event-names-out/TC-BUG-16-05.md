---
id: TC-BUG-16-05
type: sad
sad-path: validation
layer: functional
covers: ["Technical Notes: Enum.TryParse accepts comma-combined values", "Expected: 400"]
priority: P2
---

# TC-BUG-16-05: Comma-combined event "OrderShipped,OrderPaid" is rejected

## Why

- Enum.TryParse treats comma lists as flag combinations; the same validation gap as numeric input, and the fix must keep it closed. Implied by "event names outside the allowed list".

## Preconditions

- Webhooks.API running in-process via `WebhooksApiFixture` with the test authentication middleware; request is sent as an authenticated user (`X-Test-User: owner-<guid>`) with `api-version=1.0`.
- Grant URL tester stub accepts any grant URL not ending in `/reject`.

## Steps

1. `POST /api/webhooks/` as the test user with body `{"url":"https://receiver.test/webhook","grantUrl":"https://receiver.test/check","token":"secret","event":"OrderShipped,OrderPaid"}`.
2. `GET /api/webhooks/` as the same user.

## Expected result

- Step 1 returns `400 BadRequest` and the response body contains `OrderShipped,OrderPaid is invalid event name`.
- Step 2 contains no subscription for this user (no row stored with any `Type`); nothing was created.
