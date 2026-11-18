---
id: TC-HINT-1-06
type: happy
layer: functional
covers: ["AC2: tokenHint is null when the subscription has no token"]
priority: P1
---

# TC-HINT-1-06: A subscription registered without a token has tokenHint null

## Why

- AC2's third branch. The Webhooks API accepts a POST without a token (only the client UI requires one), so such rows exist and must not get `"…"` or crash the mapping.

## Preconditions

- Caller `X-Test-User: hint1-none-<guid>` registered one subscription via `POST /api/webhooks/` with body `{"url":"https://receiver.test/webhook","grantUrl":"https://receiver.test/check","event":"OrderPaid"}` (no `token` property) → 201.

## Steps

1. `GET /api/webhooks/` as `hint1-none-<guid>`; read the body as raw JSON.

## Expected result

- Status 200; the single element has property `tokenHint` whose value is JSON `null`.
- The element has no `token` property.
