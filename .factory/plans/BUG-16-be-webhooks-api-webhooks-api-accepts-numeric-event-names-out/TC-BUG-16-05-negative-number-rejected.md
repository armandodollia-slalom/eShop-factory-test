---
id: TC-BUG-16-05
type: sad
sad-path: boundary
layer: functional
covers: ["Decisions: -1 is rejected"]
priority: P2
---

# TC-BUG-16-05: Negative numeric event "-1" is rejected

## Why

- Enum.TryParse also accepts negative numbers; the story notes explicitly list -1 as rejected, so it is a separate input class from positive out-of-range numbers.

## Preconditions

- Webhooks API functional fixture (`WebhooksApiFixture`, grant tester rejects any grant URL containing `reject`). Client sends header `X-Test-User: owner-<guid>` with a fresh user id per case, api-version 1.0.
- Fresh user.

## Steps

1. `POST /api/webhooks/` with body `{"url":"https://receiver.test/webhook","grantUrl":"https://receiver.test/check","token":"secret","event":"-1"}`.

## Expected result

- Status `400`; `errors.Event` contains `"-1 is invalid event name"`.
- `GET /api/webhooks/` for the user returns an empty list.
