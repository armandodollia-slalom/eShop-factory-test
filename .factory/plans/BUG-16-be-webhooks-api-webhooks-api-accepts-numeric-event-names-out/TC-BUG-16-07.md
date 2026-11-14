---
id: TC-BUG-16-07
type: happy
layer: functional
covers: ["Regression: valid WebhookType names accepted", "Expected: 201 for allowed names"]
priority: P1
---

# TC-BUG-16-07: Each defined WebhookType name is accepted and stored with that type

## Why

- The fix must not reject valid events. Run as one data-driven case over CatalogItemPriceChange, OrderShipped and OrderPaid (exact casing); exercises all allowed values.

## Preconditions

- Webhooks.API running in-process via `WebhooksApiFixture` with the test authentication middleware; request is sent as an authenticated user (`X-Test-User: owner-<guid>`) with `api-version=1.0`.
- Grant URL tester stub accepts any grant URL not ending in `/reject`.

## Steps

1. For each of `CatalogItemPriceChange`, `OrderShipped`, `OrderPaid`: `POST /api/webhooks/` as the test user with a valid url, grantUrl and `event` set to that name.
2. `GET /api/webhooks/` as the same user.

## Expected result

- Each step 1 returns `201 Created` with a `Location` header `/api/webhooks/<id>`.
- Step 2 lists one subscription per name with `Type` equal to `1`, `2` and `3` respectively and `UserId` equal to the test user.
