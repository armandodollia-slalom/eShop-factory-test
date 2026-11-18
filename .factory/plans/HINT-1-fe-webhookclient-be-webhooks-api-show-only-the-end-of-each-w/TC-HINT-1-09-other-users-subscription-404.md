---
id: TC-HINT-1-09
type: sad
sad-path: ownership
layer: functional
covers: ["AC3: 404 for a subscription that is not the caller's"]
priority: P1
---

# TC-HINT-1-09: GET /api/webhooks/{id} of another user's subscription still returns 404 and no hint

## Why

- AC3 explicitly keeps the 404 for someone else's subscription; the rewritten handler must not start returning the response model (even with only a hint) to a non-owner.

## Preconditions

- `X-Test-User: hint1-owner-<guid>` registered a subscription with `"token":"fake-token-3c4d"` (other body fields: `"url":"https://receiver.test/webhook","grantUrl":"https://receiver.test/check","event":"OrderPaid"`) → 201, `Location: /api/webhooks/<id>`.

## Steps

1. `GET /api/webhooks/<id>` as `X-Test-User: hint1-other-<guid>`.
2. `GET /api/webhooks/` as `X-Test-User: hint1-other-<guid>`.

## Expected result

- Step 1: status 404; body is the string `Subscriptions <id> not found`; it contains neither `tokenHint`, `3c4d` nor `fake-token-3c4d`.
- Step 2: status 200 with an empty JSON array `[]`.
