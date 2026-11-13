---
id: TC-BUG-16-01
type: sad
sad-path: validation
layer: functional
covers: ["Expected: 400 BadRequest \"99 is invalid event name\"", "Technical Notes: Enum.TryParse + Enum.IsDefined"]
priority: P1
---

# TC-BUG-16-01: Numeric event name 99 outside WebhookType is rejected with 400

## Why

- This is the reported bug: Enum.TryParse accepted "99" and a type-99 subscription was stored. The endpoint filter and Validate run in-process, so a functional API test is the cheapest layer that checks the real status code and body.

## Preconditions

- Webhooks API functional fixture (`WebhooksApiFixture`, grant tester rejects any grant URL containing `reject`). Client sends header `X-Test-User: owner-<guid>` with a fresh user id per case, api-version 1.0.
- No subscriptions exist for the fresh user.

## Steps

1. As the fresh user, `POST /api/webhooks/` with body `{"url":"https://receiver.test/webhook","grantUrl":"https://receiver.test/check","token":"secret","event":"99"}`.

## Expected result

- Status `400 BadRequest` (validation problem response, not 201).
- Response body is a validation problem whose `errors.Event` array contains exactly `"99 is invalid event name"`.
- No `Location` header is returned.
