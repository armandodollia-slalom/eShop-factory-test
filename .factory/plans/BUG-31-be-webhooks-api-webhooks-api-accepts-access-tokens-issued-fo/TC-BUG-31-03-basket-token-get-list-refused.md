---
id: TC-BUG-31-03
type: sad
sad-path: auth
layer: e2e
covers: ["Steps to Reproduce step 2", "Expected: token without the webhooks scope refused; no subscription listed", "Actual: 200 with alice's subscriptions"]
priority: P1
---

# TC-BUG-31-03: Basket-only token is refused on GET /api/webhooks and lists nothing

## Why

- This is reproduction step 2 of the bug: a token issued for Basket.API listed alice's subscriptions. It needs a real `basketswaggerui` token from Identity.API, so it runs on the test stack.

## Preconditions

- Test stack up with scenario `bug-31`.
- Webhooks token and basket token for `alice` (see `_index.md`); the basket token's decoded payload has `scope` = `basket`.
- Alice owns one subscription, created with `POST {webhooks}/api/webhooks?api-version=1.0`, the webhooks token and the shared subscription body; the response is `201 Created` with `Location` `/api/webhooks/<id>`.

## Steps

1. `GET {webhooks}/api/webhooks?api-version=1.0` with `Authorization: Bearer <basket token>`.

## Expected result

- Status is `403 Forbidden`.
- The response body does not contain `http://webhooksclient:8080/webhook-received` and does not contain `secret`.
