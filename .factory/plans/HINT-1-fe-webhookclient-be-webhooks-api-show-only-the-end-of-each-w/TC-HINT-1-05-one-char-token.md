---
id: TC-HINT-1-05
type: sad
sad-path: boundary
layer: functional
covers: ["AC2: token with 1 to 4 characters shows \"…\" alone (lower edge)"]
priority: P2
---

# TC-HINT-1-05: A 1-character token yields "…" alone

## Why

- Lower edge of AC2's 1–4 range: one character is still a token (not "no token"), so the hint must be `"…"`, not `null` and not the character itself.

## Preconditions

- Caller `X-Test-User: hint1-b1-<guid>` registered one subscription via `POST /api/webhooks/` with `"token":"q"` (other body fields: `"url":"https://receiver.test/webhook","grantUrl":"https://receiver.test/check","event":"OrderPaid"`) → 201.

## Steps

1. `GET /api/webhooks/<id>` (from the POST `Location`) as `hint1-b1-<guid>`.

## Expected result

- Status 200; `tokenHint` is exactly `"…"`; no `token` property in the body.
