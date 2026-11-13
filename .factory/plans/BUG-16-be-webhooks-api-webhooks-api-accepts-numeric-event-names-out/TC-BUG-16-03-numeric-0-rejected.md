---
id: TC-BUG-16-03
type: sad
sad-path: boundary
layer: functional
covers: ["Decisions: values outside WebhookType e.g. 0 are rejected"]
priority: P1
---

# TC-BUG-16-03: Event "0" (just below the lowest defined value 1) is rejected

## Why

- WebhookType starts at 1, so 0 is the default-enum value and the lower boundary just outside the defined range; a naive fix such as `> 0` or a null check could miss it.

## Preconditions

- Webhooks API functional fixture (`WebhooksApiFixture`, grant tester rejects any grant URL containing `reject`). Client sends header `X-Test-User: owner-<guid>` with a fresh user id per case, api-version 1.0.
- Fresh user.

## Steps

1. `POST /api/webhooks/` with body `{"url":"https://receiver.test/webhook","grantUrl":"https://receiver.test/check","token":"secret","event":"0"}`.

## Expected result

- Status `400`; `errors.Event` contains `"0 is invalid event name"`.
- `GET /api/webhooks/` for the user returns an empty list.
