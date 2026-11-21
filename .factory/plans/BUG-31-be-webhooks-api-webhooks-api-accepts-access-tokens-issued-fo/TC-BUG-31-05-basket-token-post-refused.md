---
id: TC-BUG-31-05
type: sad
sad-path: auth
layer: e2e
covers: ["Expected: refused on every endpoint; no subscription created"]
priority: P1
---

# TC-BUG-31-05: Basket-only token is refused on POST /api/webhooks and nothing is created

## Why

- The bug report says a basket token could register subscriptions; registering a webhook lets the holder receive alice's order data at a URL of their choice. The case also checks persistence, so a refusal that still wrote a row is caught. Real tokens require the test stack.

## Preconditions

- Test stack up with scenario `bug-31`; alice has no webhook subscriptions.
- Webhooks token and basket token for `alice` (see `_index.md`).

## Steps

1. `POST {webhooks}/api/webhooks?api-version=1.0` with `Authorization: Bearer <basket token>` and body `{"url":"http://webhooksclient:8080/webhook-received","grantUrl":"http://webhooksclient:8080/check","token":"secret","event":"OrderPaid"}`.
2. `GET {webhooks}/api/webhooks?api-version=1.0` with `Authorization: Bearer <webhooks token>`.

## Expected result

- Step 1 returns `403 Forbidden` and has no `Location` header.
- Step 2 returns `200 OK` with body `[]`.
