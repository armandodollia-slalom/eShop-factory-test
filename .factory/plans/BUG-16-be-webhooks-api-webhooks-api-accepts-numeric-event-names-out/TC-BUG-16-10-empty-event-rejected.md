---
id: TC-BUG-16-10
type: sad
sad-path: validation
layer: functional
covers: ["Expected: event names outside the allowed list rejected"]
priority: P2
---

# TC-BUG-16-10: Empty event name is rejected

## Why

- Empty string is a non-name input that Enum.TryParse rejects; the story implies it is outside the allowed list. Checks the fix did not turn it into a different failure (500) when IsDefined is evaluated.

## Preconditions

- Webhooks API functional fixture (`WebhooksApiFixture`, grant tester rejects any grant URL containing `reject`). Client sends header `X-Test-User: owner-<guid>` with a fresh user id per case, api-version 1.0.
- Fresh user.

## Steps

1. `POST /api/webhooks/` with body `{"url":"https://receiver.test/webhook","grantUrl":"https://receiver.test/check","token":"secret","event":""}`.

## Expected result

- Status `400` (not 500); `errors.Event` is present and contains `" is invalid event name"`.
