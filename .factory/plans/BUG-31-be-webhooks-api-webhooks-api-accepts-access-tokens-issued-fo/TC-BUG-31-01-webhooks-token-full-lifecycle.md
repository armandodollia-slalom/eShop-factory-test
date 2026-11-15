---
id: TC-BUG-31-01
type: happy
layer: e2e
covers: ["Expected: a token with the webhooks scope keeps working as it does today", "Endpoints GET, GET by id, POST, DELETE"]
priority: P1
---

# TC-BUG-31-01: A webhooks-scoped token can create, list, read and delete alice's subscription

## Why

- The fix adds a scope requirement to the whole `/api/webhooks` group; if the policy misreads the `scope` claim of a real Identity token (for example because the JWT handler maps the claim type), every legitimate caller is locked out. Only the test stack issues a real JWT, so this regression runs at the e2e layer through the API.

## Preconditions

- Test stack up with scenario `bug-31` (extends `default`; alice has no webhook subscriptions).
- Webhooks token for `alice` from client `webhooksswaggerui` (see `_index.md`); its decoded payload has `scope` = `webhooks`.

## Steps

1. `POST {webhooks}/api/webhooks?api-version=1.0` with `Authorization: Bearer <webhooks token>` and body `{"url":"http://webhooksclient:8080/webhook-received","grantUrl":"http://webhooksclient:8080/check","token":"secret","event":"OrderPaid"}`. Record `<id>` from the `Location` header `/api/webhooks/<id>`.
2. `GET {webhooks}/api/webhooks?api-version=1.0` with the webhooks token.
3. `GET {webhooks}/api/webhooks/<id>?api-version=1.0` with the webhooks token.
4. `DELETE {webhooks}/api/webhooks/<id>?api-version=1.0` with the webhooks token.
5. `GET {webhooks}/api/webhooks/<id>?api-version=1.0` with the webhooks token.

## Expected result

- Step 1 returns `201 Created` with `Location` `/api/webhooks/<id>`.
- Step 2 returns `200 OK` with a JSON array of exactly one item whose `id` is `<id>`, `destUrl` is `http://webhooksclient:8080/webhook-received` and `token` is `secret`.
- Step 3 returns `200 OK` with `id` = `<id>` and `destUrl` = `http://webhooksclient:8080/webhook-received`.
- Step 4 returns `202 Accepted`.
- Step 5 returns `404 Not Found`.
