---
id: TC-HINT-1-11
type: sad
sad-path: auth
layer: e2e
covers: ["AC3: status codes unchanged (unauthenticated read)"]
priority: P2
---

# TC-HINT-1-11: GET /api/webhooks without a bearer token is still refused with 401

## Why

- AC3 keeps every status code; the read endpoints must still require identity, otherwise even hints of everyone's subscriptions would be readable. The functional host replaces authentication, so this runs as an API call on the test stack.

## Preconditions

- Test stack up with scenario `hint-1` (see `_index.md`): alice has subscriptions with tokens.

## Steps

1. `GET <webhooks-api>/api/webhooks?api-version=1.0` with no `Authorization` header.
2. `GET <webhooks-api>/api/webhooks/<id of alice's first subscription>?api-version=1.0` with no `Authorization` header.

## Expected result

- Both return 401; neither body contains `tokenHint` or any part of alice's tokens.
