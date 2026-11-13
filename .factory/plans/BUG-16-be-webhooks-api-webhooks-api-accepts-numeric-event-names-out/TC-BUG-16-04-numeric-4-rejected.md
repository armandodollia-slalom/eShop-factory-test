---
id: TC-BUG-16-04
type: sad
sad-path: boundary
layer: functional
covers: ["Expected: values outside WebhookType rejected"]
priority: P1
---

# TC-BUG-16-04: Event "4" (just above the highest defined value 3) is rejected

## Why

- Upper boundary just outside WebhookType (max is OrderPaid = 3); protects against range checks written against the wrong maximum.

## Preconditions

- Webhooks API functional fixture (`WebhooksApiFixture`, grant tester rejects any grant URL containing `reject`). Client sends header `X-Test-User: owner-<guid>` with a fresh user id per case, api-version 1.0.
- Fresh user.

## Steps

1. `POST /api/webhooks/` with body `{"url":"https://receiver.test/webhook","grantUrl":"https://receiver.test/check","token":"secret","event":"4"}`.

## Expected result

- Status `400`; `errors.Event` contains `"4 is invalid event name"`.
- `GET /api/webhooks/` for the user returns an empty list.
