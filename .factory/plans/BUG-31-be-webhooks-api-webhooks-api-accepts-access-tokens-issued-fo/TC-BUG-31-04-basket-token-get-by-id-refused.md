---
id: TC-BUG-31-04
type: sad
sad-path: auth
layer: e2e
covers: ["Expected: refused on every Webhooks.API endpoint (GET by id)"]
priority: P1
---

# TC-BUG-31-04: Basket-only token is refused on GET /api/webhooks/{id}

## Why

- The ticket requires refusal on every endpoint, and reading a single subscription exposes the same data as the list. A separate case catches a fix applied to the list route only. Real tokens require the test stack.

## Preconditions

- Test stack up with scenario `bug-31`.
- Webhooks token and basket token for `alice` (see `_index.md`).
- Alice owns one subscription created with the webhooks token and the shared subscription body; `<id>` is taken from the `201` response's `Location` `/api/webhooks/<id>`.

## Steps

1. `GET {webhooks}/api/webhooks/<id>?api-version=1.0` with `Authorization: Bearer <basket token>`.

## Expected result

- Status is `403 Forbidden`.
- The response body does not contain `http://webhooksclient:8080/webhook-received` and does not contain `secret`.
