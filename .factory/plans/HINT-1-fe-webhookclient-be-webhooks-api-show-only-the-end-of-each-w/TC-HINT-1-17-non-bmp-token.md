---
id: TC-HINT-1-17
type: sad
sad-path: boundary
layer: functional
covers: ["AC2: token longer than 4 characters, counted as characters, not UTF-16 code units"]
priority: P2
---

# TC-HINT-1-17: A token ending in a non-BMP character keeps the surrogate pair whole in its hint

## Why

- The hint counts text elements; slicing the last 4 UTF-16 code units would split a character outside the Basic Multilingual Plane and return a broken surrogate. Guards a regression to code-unit slicing.

## Preconditions

- Caller `X-Test-User: hint1-nonbmp-<guid>` registered one subscription via `POST /api/webhooks/` with `"token":"fake-token-ab😀"` (U+1F600 at the end; other body fields as in TC-HINT-1-03) → 201.

## Steps

1. `GET /api/webhooks/` as `hint1-nonbmp-<guid>`.

## Expected result

- Status 200; the single element's `tokenHint` is `"…-ab😀"` (U+2026 + `-ab` + U+1F600, surrogate pair intact).
