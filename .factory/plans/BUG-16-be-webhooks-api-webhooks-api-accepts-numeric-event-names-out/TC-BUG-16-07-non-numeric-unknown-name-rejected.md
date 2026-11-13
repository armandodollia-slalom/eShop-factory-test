---
id: TC-BUG-16-07
type: sad
sad-path: validation
layer: functional
covers: ["Decisions: error message format unchanged"]
priority: P1
---

# TC-BUG-16-07: Non-numeric unknown event name is still rejected

## Why

- Regression guard: the fix must keep the existing name-based rejection and message format (previously only covered by the generic "invalid" payload test, which also had bad URLs).

## Preconditions

- Webhooks API functional fixture (`WebhooksApiFixture`, grant tester rejects any grant URL containing `reject`). Client sends header `X-Test-User: owner-<guid>` with a fresh user id per case, api-version 1.0.
- Fresh user; valid url and grantUrl.

## Steps

1. `POST /api/webhooks/` with body `{"url":"https://receiver.test/webhook","grantUrl":"https://receiver.test/check","token":"secret","event":"NotAnEvent"}`.

## Expected result

- Status `400`; `errors.Event` contains `"NotAnEvent is invalid event name"`.
- `errors` contains no `Url` or `GrantUrl` keys.
