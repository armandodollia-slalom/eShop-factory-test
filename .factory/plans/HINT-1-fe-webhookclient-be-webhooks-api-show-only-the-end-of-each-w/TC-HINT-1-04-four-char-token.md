---
id: TC-HINT-1-04
type: sad
sad-path: boundary
layer: functional
covers: ["AC2: token with 1 to 4 characters shows \"…\" alone (upper edge)"]
priority: P1
---

# TC-HINT-1-04: A 4-character token yields "…" alone, never the whole token

## Why

- AC2 forbids showing a whole token; with a 4-character token "the last 4 characters" is the whole token, so this is the edge where a naive implementation leaks it.

## Preconditions

- Caller `X-Test-User: hint1-b4-<guid>` registered one subscription via `POST /api/webhooks/` with `"token":"wxyz"` (other body fields: `"url":"https://receiver.test/webhook","grantUrl":"https://receiver.test/check","event":"OrderPaid"`) → 201.

## Steps

1. `GET /api/webhooks/` as `hint1-b4-<guid>`.

## Expected result

- Status 200; the single element's `tokenHint` is exactly `"…"` (one U+2026 character).
- The response body does not contain `wxyz`.
