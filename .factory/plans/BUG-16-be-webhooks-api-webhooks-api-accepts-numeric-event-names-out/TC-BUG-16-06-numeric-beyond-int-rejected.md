---
id: TC-BUG-16-06
type: sad
sad-path: boundary
layer: functional
covers: ["Expected: numeric names outside the allowed list are rejected"]
priority: P3
---

# TC-BUG-16-06: Event larger than Int32 ("99999999999") is rejected

## Why

- A numeric string that overflows the enum underlying type exercises the TryParse-false branch for digits; confirms the same 400 and message for numbers of any size.

## Preconditions

- Webhooks API functional fixture (`WebhooksApiFixture`, grant tester rejects any grant URL containing `reject`). Client sends header `X-Test-User: owner-<guid>` with a fresh user id per case, api-version 1.0.
- Fresh user.

## Steps

1. `POST /api/webhooks/` with body `{"url":"https://receiver.test/webhook","grantUrl":"https://receiver.test/check","token":"secret","event":"99999999999"}`.

## Expected result

- Status `400`; `errors.Event` contains `"99999999999 is invalid event name"`.
