---
id: TC-HINT-1-16
type: happy
layer: functional
covers: ["AC5: the token entered at registration is the token the Webhooks API sends with each webhook call"]
priority: P1
---

# TC-HINT-1-16: An OrderPaid webhook call carries the registered token in full

## Why

- AC5 requires that the registered token is still the one sent with each webhook call; checking the stored value alone does not prove the outgoing `X-eshop-whtoken` header. The OrderPaid handler only reads subscriptions of that type and calls the sender, so the call can be triggered in-process on the functional host (real Postgres) without an order on the test stack; the e2e layer would need a whole order flow this story does not touch.

## Preconditions

- Functional host built for this test as in TC-HINT-1-14: real `GrantUrlTesterService`, default `HttpClient` primary handler replaced by a controlled receiver created for this test only.
- The receiver answers `OPTIONS https://receiver.test/check-<guid>` with 200 and echoes the request's `X-eshop-whtoken` header in its response, answers every `POST` with 200, and records every request (method, URL, headers).
- Caller `X-Test-User: hint1-send-<guid>`. The same `<guid>` is used in the URLs so other tests' OrderPaid subscriptions in the shared database cannot match.

## Steps

1. `POST /api/webhooks/` body `{"url":"https://receiver.test/hook-<guid>","grantUrl":"https://receiver.test/check-<guid>","token":"fake-token-for-tests-9z8y","event":"OrderPaid"}`.
2. From a service scope of the same host, resolve the integration event handler registered for `OrderStatusChangedToPaidIntegrationEvent` and call `Handle(new OrderStatusChangedToPaidIntegrationEvent(1, []))`.

## Expected result

- Step 1: status 201.
- Step 2: the receiver recorded exactly one `POST https://receiver.test/hook-<guid>`.
- That request's `X-eshop-whtoken` header is exactly `fake-token-for-tests-9z8y`: the full registered token, not its hint `…9z8y`.
- That request's body is JSON whose `Type` property is `"OrderPaid"` (`WebhookData` serialized with default options).
