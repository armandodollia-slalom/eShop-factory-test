---
id: TC-BUG-31-06
type: sad
sad-path: auth
layer: e2e
covers: ["Steps to Reproduce step 3", "Expected: refused; no subscription deleted", "Actual: step 3 deletes the subscription"]
priority: P1
---

# TC-BUG-31-06: Basket-only token is refused on DELETE /api/webhooks/{id} and the subscription survives

## Why

- This is reproduction step 3: the basket token deleted alice's subscription. Asserting that the subscription still exists afterwards proves no delete happened, not only that the status changed. Real tokens require the test stack.

## Preconditions

- Test stack up with scenario `bug-31`.
- Webhooks token and basket token for `alice` (see `_index.md`).
- Alice owns one subscription created with the webhooks token and the shared subscription body; `<id>` is taken from the `201` response's `Location` `/api/webhooks/<id>`.

## Steps

1. `DELETE {webhooks}/api/webhooks/<id>?api-version=1.0` with `Authorization: Bearer <basket token>`.
2. `GET {webhooks}/api/webhooks/<id>?api-version=1.0` with `Authorization: Bearer <webhooks token>`.

## Expected result

- Step 1 returns `403 Forbidden`.
- Step 2 returns `200 OK` with `id` = `<id>` and `destUrl` = `http://webhooksclient:8080/webhook-received`.
