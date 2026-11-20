---
id: TC-BUG-53-03
type: sad
sad-path: boundary
layer: e2e
covers: ["Expected: a price update that does not change the price calls nothing"]
priority: P1
---

# TC-BUG-53-03: An update of item 99 that keeps its price calls no webhook

## Why

- The ticket says a price update that leaves the price unchanged calls nothing. This is the boundary of "price changed": new price equal to old price. If it broke, every catalog edit would notify subscribers with a fake price change. Whether an event is published is decided in the Catalog API, and the absence of a call is only observable at the destination. So the case runs on the test stack, with the same registration as TC-BUG-53-01.

## Preconditions

- Test stack running with scenario `bug-53` (reloaded before the case): item 99 with `Price` `199.99`; user `alice` (password `Pass123$`); no webhook subscriptions.
- The webhooks client runs without a `ValidateToken` setting (as the test stack compose configures it), so it accepts the case's own token.
- A Webhooks API access token for `alice` with scope `webhooks`.
- Token value used for this case: `bug53-same`. No received message carrying it exists in the webhooks client.

## Steps

1. `POST {webhooks}/api/webhooks?api-version=1.0` with `Authorization: Bearer <alice token>` and body `{"url": "http://webhooksclient:8080/webhook-received", "grantUrl": "http://webhooksclient:8080/check", "token": "bug53-same", "event": "CatalogItemPriceChange"}`.
2. `GET {catalog}/api/catalog/items/99?api-version=2.0` (anonymous).
3. `PUT {catalog}/api/catalog/items/99?api-version=2.0` (anonymous) with the body from step 2 unchanged (`price` `199.99`).
4. Wait 30 seconds, then open the webhooks client's home page signed in as `alice` and read the "Received messages" grid.

## Expected result

- Step 1 answers `201 Created`.
- Step 3 answers `201 Created`.
- After step 4 the grid holds no row whose Token is `bug53-same`.
- `GET {catalog}/api/catalog/items/99?api-version=2.0` still answers `price` `199.99`.
