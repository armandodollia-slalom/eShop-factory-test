---
id: TC-HINT-1-14
type: happy
layer: functional
covers: ["AC5: POST /api/webhooks and the grant check behave as today", "AC5: the token entered is the token stored"]
priority: P1
---

# TC-HINT-1-14: POST /api/webhooks still stores the exact token and sends it to the grant URL

## Why

- AC5: hiding the token on reads must not change what is checked or stored. The grant check is observed as the HTTP exchange it really is (the real `GrantUrlTesterService` sends `OPTIONS` with `X-eshop-whtoken` and needs the same header back), so a token replaced by its hint anywhere on the registration path would show up in the header or in the row, not in a test double's internal state.

## Preconditions

- Functional host built for this test from the Webhooks functional fixture with the real `GrantUrlTesterService` (the fixture's `ConfigurableGrantUrlTester` replacement removed) and the default `HttpClient`'s primary handler replaced by a controlled receiver created for this test only.
- The receiver answers `OPTIONS https://receiver.test/check` with status 200 and a response header `X-eshop-whtoken` equal to the `X-eshop-whtoken` header of the request it received, and records every request it receives (method, URL, headers).
- Caller `X-Test-User: hint1-store-<guid>`.

## Steps

1. `POST /api/webhooks/` body `{"url":"https://receiver.test/webhook","grantUrl":"https://receiver.test/check","token":"fake-token-for-tests-9z8y","event":"OrderPaid"}`.
2. Read the `Subscriptions` row with the id from the `Location` header directly from the Webhooks database.

## Expected result

- Step 1: status 201 with `Location: /api/webhooks/<id>`.
- Step 1: the receiver recorded exactly one request: `OPTIONS https://receiver.test/check` whose `X-eshop-whtoken` header is exactly `fake-token-for-tests-9z8y` (the full token, not `…9z8y`).
- Step 2: the row's `Token` is exactly `fake-token-for-tests-9z8y`, `UserId` is `hint1-store-<guid>`, `DestUrl` is `https://receiver.test/webhook`.
