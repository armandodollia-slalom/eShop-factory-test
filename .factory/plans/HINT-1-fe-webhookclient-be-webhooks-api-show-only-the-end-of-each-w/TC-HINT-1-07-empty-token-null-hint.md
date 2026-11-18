---
id: TC-HINT-1-07
type: sad
sad-path: boundary
layer: functional
covers: ["AC2: 0-character token is outside 1–4, treated as no token"]
priority: P2
---

# TC-HINT-1-07: A subscription registered with an empty token has tokenHint null

## Why

- Just below AC2's 1–4 range: an empty string is not a 1–4 character token, so the literal reading (and the recorded decision) is "no token" → `null`, not `"…"`.

## Preconditions

- Caller `X-Test-User: hint1-empty-<guid>` registered one subscription via `POST /api/webhooks/` with `"token":""` (other body fields: `"url":"https://receiver.test/webhook","grantUrl":"https://receiver.test/check","event":"OrderPaid"`) → 201.

## Steps

1. `GET /api/webhooks/` as `hint1-empty-<guid>`.

## Expected result

- Status 200; the single element's `tokenHint` is JSON `null`.
