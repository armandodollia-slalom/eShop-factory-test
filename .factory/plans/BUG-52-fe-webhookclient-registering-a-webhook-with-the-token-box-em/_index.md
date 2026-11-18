---
story: BUG-52
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/283"
story-sha: 952e849884b0
automation-sha: ac66db0ff3e0
automation-plan-sha: da27200bcf69
automation-score: 10
automation-verified-at: "2026-11-18T22:25:39.189Z"
plan-sha: da27200bcf69
verified-score: 10
verified-at: "2026-11-18T22:15:48.186Z"
verified-by: test-planner@c9e755e4/council
---
# Test plan: BUG-52 [FE - WebhookClient] - Registering a webhook with the Token box empty does nothing

The webhooks client's "Register a new webhook" page (`/add-webhook`) must, when Register is clicked with an empty Token box, show a message next to the form saying a token is needed and register no webhook; Register with a token must keep today's behaviour (the webhook is registered and the user lands on the home page). The behaviour lives in a Blazor page of the WebhookClient, so every case runs on the `e2e` layer through the browser on the test stack, signed in to the webhooks client as `alice` (`Pass123$`) on scenario `default` (no webhook subscriptions).

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-52-01 | Register with an empty Token box shows "A token is needed to register a webhook." next to the form | sad | e2e | Expected: message next to the form; Steps to Reproduce 1-4 |
| TC-BUG-52-02 | Register with an empty Token box registers no webhook | sad | e2e | Expected: no webhook is registered |
| TC-BUG-52-03 | Register with a token registers the webhook and returns to the home page as before | happy | e2e | Expected: Register with a token behaves exactly as today |
| TC-BUG-52-04 | After the empty-token message, entering a token and registering succeeds | happy | e2e | Expected: Register with a token behaves exactly as today; Expected: message for the empty box |

Since HINT-1, the home page grid and `GET /api/webhooks` show only a token hint (`…` plus the last four characters) and never the full token; TC-BUG-52-03 and TC-BUG-52-04 therefore check the hint in the grid and API and the full token in the stored `Subscriptions` row.

## Out of scope

- The Webhooks API (`POST /api/webhooks`) contract and its validation: the story changes only the client page; BUG-16 covers the API.
- Styling of the message beyond its placement below the form and its text.

## Open questions

- A Token box holding only spaces: the story says "empty"; the page's guard (`string.IsNullOrEmpty`) treats spaces as a token and sends the request. The story does not say whether whitespace counts as empty, so no case asserts either outcome.
- The token-present rejection path ("Registation was rejected with status ...") is part of "behaves exactly as today", but the story names no way to make the Webhooks API reject a request on the test stack (the stack's own `/check` endpoint echoes the token, so the grant check passes). No case is written for it.
- Whether the empty-token message must disappear when the user starts typing (before clicking Register) is not stated; TC-BUG-52-04 asserts only the state after a successful registration.
