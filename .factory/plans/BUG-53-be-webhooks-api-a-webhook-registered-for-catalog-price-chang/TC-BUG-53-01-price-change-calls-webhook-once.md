---
id: TC-BUG-53-01
type: happy
layer: e2e
covers: ["Steps to Reproduce 1-4", "Expected: destination receives one webhook call with the item's id, new price and old price", "Expected: the webhooks client lists it among the received messages", "Expected: webhooks registered for OrderPaid and OrderShipped behave exactly as today", "Acceptance Criteria"]
priority: P1
---

# TC-BUG-53-01: Changing item 99's price calls the CatalogItemPriceChange webhook once with the id, new price and old price, and no OrderPaid or OrderShipped webhook

## Why

- This is the bug itself: the Steps to Reproduce, run on the test stack, must end with exactly one received message for the price change, holding the item id, the new price and the old price. Registering `OrderPaid` and `OrderShipped` webhooks alongside it also proves the price change reaches only the price-change registration, so order webhooks keep today's behaviour (a handler that fetched every subscription, or the wrong type, would add rows under their tokens). The defect lives between services (Catalog API publishes, the event bus delivers, the Webhooks API handler sends, the webhooks client receives); only the running stack exercises that chain, so the case is `e2e`, following the ticket's own steps.

## Preconditions

- Test stack running with scenario `bug-53` (extends `default`, reloaded before the case): catalog item 99 "Adventurer GPS Watch" with `Price` `199.99`; user `alice` (password `Pass123$`); no webhook subscriptions.
- The webhooks client runs without a `ValidateToken` setting (as the test stack compose configures it), so its `check` and `webhook-received` endpoints accept any token. That lets each registration carry its own token so rows can be told apart.
- A Webhooks API access token for `alice` with scope `webhooks` (identity client `webhooksswaggerui`, implicit flow, as in `e2e/teststack/bug-16.spec.ts`).
- Tokens used for this case: `bug53-price`, `bug53-paid` and `bug53-shipped`. No received message carrying any of them exists in the webhooks client yet.

## Steps

1. `POST {webhooks}/api/webhooks?api-version=1.0` with `Authorization: Bearer <alice token>` and body `{"url": "http://webhooksclient:8080/webhook-received", "grantUrl": "http://webhooksclient:8080/check", "token": "bug53-paid", "event": "OrderPaid"}`.
2. The same request with `"token": "bug53-shipped", "event": "OrderShipped"`.
3. The same request with `"token": "bug53-price", "event": "CatalogItemPriceChange"`.
4. `GET {webhooks}/api/webhooks?api-version=1.0` with the same bearer token.
5. `GET {catalog}/api/catalog/items/99?api-version=2.0` (anonymous).
6. `PUT {catalog}/api/catalog/items/99?api-version=2.0` (anonymous) with the body from step 5, only `price` changed to `149.99`.
7. Wait 30 seconds, then open the webhooks client's home page (`{webhooksclient}/`) signed in as `alice` and read the "Received messages" grid.

## Expected result

- Steps 1, 2 and 3 each answer `201 Created`.
- Step 4 answers `200` and lists a subscription with event `CatalogItemPriceChange`, destination `http://webhooksclient:8080/webhook-received` and token `bug53-price`.
- Step 5 answers `200` with `price` `199.99`.
- Step 6 answers `201 Created`.
- After step 7 the grid holds exactly one row whose Token is `bug53-price`.
- That row's Data is a JSON object with `"ProductId": 99`, `"NewPrice": 149.99` and `"OldPrice": 199.99`.
- The grid holds no row whose Token is `bug53-paid` and no row whose Token is `bug53-shipped`.
