---
id: TC-HINT-1-03
type: sad
sad-path: boundary
layer: functional
covers: ["AC2: token longer than 4 characters (just above the limit)"]
priority: P1
---

# TC-HINT-1-03: A 5-character token yields "…" plus its last 4 characters

## Why

- AC2 switches rule at 4 characters; 5 is the shortest token that shows its end. Guards an off-by-one (`>=` vs `>`) that would hide the hint or show the whole token.

## Preconditions

- Caller `X-Test-User: hint1-b5-<guid>` registered one subscription via `POST /api/webhooks/` with `"token":"abcde"` (other body fields: `"url":"https://receiver.test/webhook","grantUrl":"https://receiver.test/check","event":"OrderPaid"`) → 201.

## Steps

1. `GET /api/webhooks/` as `hint1-b5-<guid>`.

## Expected result

- Status 200; the single element's `tokenHint` is `"…bcde"` (U+2026 + `bcde`), never `"abcde"` or `"…"`.
