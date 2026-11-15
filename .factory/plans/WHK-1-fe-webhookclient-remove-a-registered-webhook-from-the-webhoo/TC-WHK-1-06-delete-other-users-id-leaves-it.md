---
id: TC-WHK-1-06
type: sad
sad-path: ownership
layer: functional
covers: ["AC3", "Outputs: other users' subscriptions are unchanged", "Implementation Notes code map: DELETE handler filters on s.UserId == userId"]
priority: P1
---

# TC-WHK-1-06: DELETE of another user's subscription id leaves that subscription in place

## Why

- The client sends `DELETE /api/webhooks/{id}` with the id it shows, so the only guard against removing another user's subscription is the API's owner filter. TC-WHK-1-05 cannot send a foreign id through the UI, so this case calls the API directly with another user's id. Functional (Webhooks.FunctionalTests with `TestAuthenticationMiddleware`) is the cheapest layer that runs the real handler against Postgres.

## Preconditions

- Webhooks.FunctionalTests fixture running with an empty `Subscriptions` table and its `ConfigurableGrantUrlTester` accepting the grant URL `https://receiver.test/check`.
- With header `X-Test-User: user-alice` (read by `TestAuthenticationMiddleware` as the `sub` claim), `POST /api/webhooks?api-version=1.0` with body `{"url":"https://receiver.test/hook","grantUrl":"https://receiver.test/check","token":"whk1-06-alice","event":"OrderPaid"}` succeeded; `GET /api/webhooks?api-version=1.0` as `user-alice` returns one item, its `id` recorded as `aliceId`.

## Steps

1. With header `X-Test-User: user-bob`, send `DELETE /api/webhooks/{aliceId}?api-version=1.0`.
2. With header `X-Test-User: user-alice`, send `GET /api/webhooks?api-version=1.0`.

## Expected result

- Step 1 does not return a 2xx status.
- Step 2 returns 200 with exactly one item whose `id` equals `aliceId` and whose `token` is `whk1-06-alice`.
