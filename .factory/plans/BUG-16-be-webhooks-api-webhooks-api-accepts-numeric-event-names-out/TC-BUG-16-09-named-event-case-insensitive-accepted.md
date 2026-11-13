---
id: TC-BUG-16-09
type: happy
layer: functional
covers: ["Decisions: defined WebhookType members stay accepted (regression guard)"]
priority: P2
---

# TC-BUG-16-09: Valid event name in different casing ("orderpaid") is accepted

## Why

- Not a story requirement: a regression guard for existing behavior. Names must still be accepted case-insensitively after adding the IsDefined check; the existing lifecycle test only uses the exact-case name.

## Preconditions

- Webhooks API functional fixture (`WebhooksApiFixture`, grant tester rejects any grant URL containing `reject`). Client sends header `X-Test-User: owner-<guid>` with a fresh user id per case, api-version 1.0.
- Fresh user.

## Steps

1. `POST /api/webhooks/` with body `{"url":"https://receiver.test/webhook","grantUrl":"https://receiver.test/check","token":"secret","event":"orderpaid"}`.
2. `GET` the URL from the `Location` header as the same user.

## Expected result

- Step 1 returns `201 Created`.
- Step 2 returns `200` and `Type` is `OrderPaid` (3).
