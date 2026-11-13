---
id: TC-BUG-16-08
type: happy
layer: functional
covers: ["Decisions: numeric strings that name a defined member stay accepted"]
priority: P1
---

# TC-BUG-16-08: Numeric string naming a defined member ("1") is still accepted

## Why

- The fix must not over-reject: the story records that "1" keeps working as before. Guards against switching to a purely-numeric rejection.

## Preconditions

- Webhooks API functional fixture (`WebhooksApiFixture`, grant tester rejects any grant URL containing `reject`). Client sends header `X-Test-User: owner-<guid>` with a fresh user id per case, api-version 1.0.
- Fresh user.

## Steps

1. `POST /api/webhooks/` with body `{"url":"https://receiver.test/webhook","grantUrl":"https://receiver.test/check","token":"secret","event":"1"}`.
2. `GET` the URL from the `Location` header as the same user.

## Expected result

- Step 1 returns `201 Created` with a `Location` header `/api/webhooks/<id>`.
- Step 2 returns `200` and the subscription `Type` is `CatalogItemPriceChange` (1), `UserId` is the fresh user.
