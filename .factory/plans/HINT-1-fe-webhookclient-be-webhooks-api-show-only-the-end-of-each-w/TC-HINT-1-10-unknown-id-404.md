---
id: TC-HINT-1-10
type: sad
sad-path: not-found
layer: functional
covers: ["AC3: status codes unchanged (404 for a missing subscription)"]
priority: P2
---

# TC-HINT-1-10: GET /api/webhooks/{id} for an id that does not exist still returns 404

## Why

- AC3 says status codes are unchanged; the mapping must only run on a found entity, so a missing id must keep its 404 instead of failing with 500 on a null subscription.

## Preconditions

- Caller `X-Test-User: hint1-missing-<guid>` with no subscriptions.

## Steps

1. `GET /api/webhooks/2147483647` as `hint1-missing-<guid>`.

## Expected result

- Status 404; body is the string `Subscriptions 2147483647 not found`.
