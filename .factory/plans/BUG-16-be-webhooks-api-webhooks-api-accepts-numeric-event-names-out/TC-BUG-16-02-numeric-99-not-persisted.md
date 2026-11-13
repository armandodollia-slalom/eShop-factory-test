---
id: TC-BUG-16-02
type: sad
sad-path: validation
layer: functional
covers: ["Actual: a subscription of type 99 is stored"]
priority: P1
---

# TC-BUG-16-02: Rejected numeric event does not store a subscription

## Why

- The bug had a persistence side effect (a dead subscription of type 99). A 400 alone would not prove nothing was written, so this case checks stored state separately.

## Preconditions

- Webhooks API functional fixture (`WebhooksApiFixture`, grant tester rejects any grant URL containing `reject`). Client sends header `X-Test-User: owner-<guid>` with a fresh user id per case, api-version 1.0.
- Fresh user with no subscriptions.

## Steps

1. As the fresh user, `POST /api/webhooks/` with body `{"url":"https://receiver.test/webhook","grantUrl":"https://receiver.test/check","token":"secret","event":"99"}`.
2. As the same user, `GET /api/webhooks/`.

## Expected result

- Step 1 returns `400`.
- Step 2 returns `200` with an empty list (no subscription with `Type` 99 or any other, for this user).
