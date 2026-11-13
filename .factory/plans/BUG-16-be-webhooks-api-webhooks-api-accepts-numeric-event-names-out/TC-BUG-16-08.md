---
id: TC-BUG-16-08
type: happy
layer: functional
covers: ["Regression: names matched case-insensitively"]
priority: P2
---

# TC-BUG-16-08: Event name is still matched case-insensitively ("orderpaid")

## Why

- The endpoint parses with ignoreCase and the validator compares OrdinalIgnoreCase; the fix must preserve that.

## Preconditions

- Webhooks.API running in-process via `WebhooksApiFixture` with the test authentication middleware; request is sent as an authenticated user (`X-Test-User: owner-<guid>`) with `api-version=1.0`.
- Grant URL tester stub accepts any grant URL not ending in `/reject`.

## Steps

1. `POST /api/webhooks/` as the test user with body `{"url":"https://receiver.test/webhook","grantUrl":"https://receiver.test/check","token":"secret","event":"orderpaid"}`.
2. `GET /api/webhooks/` as the same user.

## Expected result

- Step 1 returns `201 Created`.
- Step 2 contains a subscription with `Type` `3` (OrderPaid) for this user.
