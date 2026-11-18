---
story: HINT-1
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/297"
story-sha: 571f589dcad2
plan-sha: f5d524c27fca
verified-score: 10
verified-at: "2026-11-18T20:11:15.805Z"
verified-by: test-planner@c9e755e4/council
automation-sha: f81f07aaa6d4
automation-plan-sha: f5d524c27fca
automation-score: 10
automation-verified-at: "2026-11-18T20:41:47.133Z"
---
# Test plan: HINT-1 Show only the end of each webhook's token

Scope: the Webhooks API's two read endpoints (`GET /api/webhooks`, `GET /api/webhooks/{id}`) stop returning `token` and return `tokenHint` (AC1–AC3), the webhooks client's home page Token column shows that hint or "None" (AC4), and registration plus the grant check stay unchanged (AC5). The hint rule and its boundaries, field preservation and the unchanged status codes are checked at the functional layer (`tests/Webhooks.FunctionalTests`, where the caller is set with `X-Test-User` and the grant tester is configurable); what the user sees, and the unauthenticated read the functional host cannot exercise, run on the test stack (`e2e/teststack/hint-1.spec.ts`).

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-HINT-1-03 | A 5-character token yields "…" plus its last 4 characters | sad (boundary) | functional | AC2 just above 4 |
| TC-HINT-1-04 | A 4-character token yields "…" alone, never the whole token | sad (boundary) | functional | AC2 upper edge of 1–4 |
| TC-HINT-1-05 | A 1-character token yields "…" alone | sad (boundary) | functional | AC2 lower edge of 1–4 |
| TC-HINT-1-06 | A subscription registered without a token has tokenHint null | happy | functional | AC2 no token |
| TC-HINT-1-07 | A subscription registered with an empty token has tokenHint null | sad (boundary) | functional | AC2 0 chars |
| TC-HINT-1-08 | List and single answers carry tokenHint instead of token and keep id, type, date, destUrl and userId with their values | happy | functional | AC1 list and single, AC2 >4 chars, AC3 fields, 200 |
| TC-HINT-1-09 | GET /api/webhooks/{id} of another user's subscription still returns 404 and no hint | sad (ownership) | functional | AC3 404 not caller's |
| TC-HINT-1-10 | GET /api/webhooks/{id} for an id that does not exist still returns 404 | sad (not-found) | functional | AC3 status codes |
| TC-HINT-1-11 | GET /api/webhooks without a bearer token is still refused with 401 | sad (auth) | e2e | AC3 status codes |
| TC-HINT-1-12 | After registering on /add-webhook, the home page Token column shows "…" and the last 4 characters | happy | e2e | AC4 hint, AC5 /add-webhook |
| TC-HINT-1-13 | The home page Token column shows "None" for a webhook without a token and hints for the others | happy | e2e | AC4 None, AC4 hints |
| TC-HINT-1-14 | POST /api/webhooks still stores the exact token and sends it to the grant URL | happy | functional | AC5 POST, grant, stored token |
| TC-HINT-1-15 | A rejected grant check still returns 400 and stores nothing | sad (dependency-failure) | functional | AC5 grant check |
| TC-HINT-1-16 | An OrderPaid webhook call carries the registered token in full | happy | functional | AC5 token sent with each webhook call |

## Test data

- Functional cases create their own subscriptions through `POST /api/webhooks/` under a fresh `X-Test-User` per case; tokens are fake values (`fake-token-3c4d`, `abcde`, `wxyz`, `q`, `fake-token-for-tests…`).
- TC-HINT-1-14 and TC-HINT-1-16 run on a host built per test from the functional fixture that keeps the real `GrantUrlTesterService` and replaces the default `HttpClient`'s primary handler with a controlled receiver: it echoes `X-eshop-whtoken` on `OPTIONS` to the grant URL, answers `POST` with 200 and records every request. TC-HINT-1-16 triggers the webhook call by invoking the `OrderStatusChangedToPaidIntegrationEvent` handler in-process and uses `<guid>`-unique URLs because other tests' OrderPaid subscriptions share the database.
- New scenario `hint-1` (`.factory/stack/scenarios/hint-1`, `extends: default`) with a `webhooksdb.sql` that inserts three `Subscriptions` rows for alice (`UserId` = alice's id from `default/identitydb.sql`), all `Type` 3 (OrderPaid): `DestUrl` `http://receiver.test/long` with `Token` `fake-token-3c4d`; `http://receiver.test/short` with `Token` `wxyz`; `http://receiver.test/none` with `Token` NULL. The spec reloads it before each case.
- TC-HINT-1-12 types the client's configured token (`WebhookClientOptions:Token`), read from the stack configuration at run time; plans and specs never copy its value.

## Out of scope

- `DELETE /api/webhooks/{id}`: the story does not touch it.
- The `WebhookSubscription` entity and database schema: unchanged by design; only the stored value is checked (TC-HINT-1-14).
- Showing the client's own token setting anywhere: the story says it is not shown anywhere new; no new UI exists to test.

## Open questions

- The story does not say whether the hint counts characters as UTF-16 code units or text elements; tokens with surrogate pairs or combining marks are not planned.
- Exact 401 response body for an unauthenticated read is not defined; TC-HINT-1-11 checks only the status and that no hint or token leaks.
