---
id: TC-BUG-31-07
type: sad
sad-path: auth
layer: e2e
covers: ["Expected: requests without a webhooks-scoped token are refused (no token at all)"]
priority: P2
---

# TC-BUG-31-07: Request without a token is refused with 401

## Why

- Replacing the group's plain authorization requirement with a scope policy could drop the authenticated-user requirement; a request with no token at all must still be refused. It runs on the stack next to the other cases, against the real JWT bearer setup.

## Preconditions

- Test stack up with scenario `bug-31`.
- Alice owns one subscription created with the webhooks token (see `_index.md`) and the shared subscription body.

## Steps

1. `GET {webhooks}/api/webhooks?api-version=1.0` with no `Authorization` header.

## Expected result

- Status is `401 Unauthorized`.
- The response body does not contain `http://webhooksclient:8080/webhook-received`.
