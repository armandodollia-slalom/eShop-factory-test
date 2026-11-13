---
id: TC-BUG-16-11
type: sad
sad-path: validation
layer: functional
covers: ["Expected result: values outside the allowed list are rejected", "Enum.TryParse accepts comma-combined flags"]
priority: P1
---

# TC-BUG-16-11: Comma-combined event values are rejected

## Why

- `Enum.TryParse` accepts comma-separated values and ORs them (`"1,2"` parses to `3` = `OrderPaid`), so a combined value would be stored as a single, different event type. The fix rejects any event containing `,`; this case guards that.

## Preconditions

- Webhooks API functional fixture (`WebhooksApiFixture`, grant tester rejects any grant URL containing `reject`). Client sends header `X-Test-User: owner-<guid>` with a fresh user id per value, api-version 1.0.
- Fresh user; valid url and grantUrl.

## Steps

1. `POST /api/webhooks/` with body `{"url":"https://receiver.test/webhook","grantUrl":"https://receiver.test/check","token":"secret","event":"1,2"}`.
2. `GET /api/webhooks/` as the same user.
3. Repeat steps 1 and 2 with a fresh user and `"event":"CatalogItemPriceChange,OrderShipped"`.

## Expected result

- Each POST: status `400`, no `Location` header; `errors.Event` is exactly `["<event> is invalid event name"]` (`"1,2 is invalid event name"`, `"CatalogItemPriceChange,OrderShipped is invalid event name"`); `errors` has only the `Event` key.
- Each GET: `200` with an empty list (nothing stored, in particular no `OrderPaid` subscription).
