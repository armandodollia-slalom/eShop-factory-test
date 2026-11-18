---
id: TC-HINT-1-15
type: sad
sad-path: dependency-failure
layer: functional
covers: ["AC5: the grant check behaves as today (rejected grant)"]
priority: P2
---

# TC-HINT-1-15: A rejected grant check still returns 400 and stores nothing

## Why

- AC5 keeps the grant check exactly as today; this existing error is the only failure path of registration and must survive the change unchanged.

## Preconditions

- Functional host whose grant tester rejects any grant URL containing `reject`.
- Caller `X-Test-User: hint1-reject-<guid>` with no subscriptions.

## Steps

1. `POST /api/webhooks/` body `{"url":"https://receiver.test/webhook","grantUrl":"https://receiver.test/reject","token":"fake-token-for-tests","event":"OrderPaid"}`.
2. `GET /api/webhooks/` as `hint1-reject-<guid>`.

## Expected result

- Step 1: status 400; body is the string `Invalid grant URL: https://receiver.test/reject`.
- Step 2: status 200 with `[]`.
