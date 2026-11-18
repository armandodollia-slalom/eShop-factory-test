---
story: BUG-50
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/262"
story-sha: d4530b553a22
plan-sha: 66bf25c69703
verified-score: 9
verified-at: "2026-11-18T04:40:29.828Z"
verified-by: test-planner@6ab9e852/council
automation-sha: 4408e70ba38d
automation-plan-sha: 66bf25c69703
automation-score: 10
automation-verified-at: "2026-11-18T04:45:14.133Z"
---
# Test plan: BUG-50 Anyone who opens the webhook client sees every webhook message it received, with its token

Scope: the webhook client's home page ("Order management") must hide the "Webhook messages received (orders paid)" list, including each message's token, from visitors who are not signed in, and show it unchanged to signed-in users. Both cases run at the `e2e` layer on the test stack (webhook client on host port `WEBHOOKSCLIENT_HOST_PORT`, default 28086): the bug is about what a browser sees on a server-rendered Blazor page behind OIDC sign-in through Identity, so no cheaper layer exercises it (there is no WebhookClient functional test project). Messages are delivered with the same request the Webhooks API sends (`POST /webhook-received`); the test stack sets no `ValidateToken`, so the client accepts any token. Received messages live in the client's in-memory repository, so each case delivers its own message with a payload unique to the run and asserts on that payload, not on the list being empty.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-50-01 | Anonymous visitor sees a log-in prompt instead of received messages and tokens | sad | e2e | Expected: step 2 shows no received message and no token; messages section asks the visitor to log in as the registered webhooks section does; Steps to Reproduce 1-2 |
| TC-BUG-50-02 | Signed-in user sees received messages with When, Data and Token as before | happy | e2e | Expected: signed in, the received messages are shown exactly as today |

## Out of scope

- Registering a webhook and paying an order to make the Webhooks API fire the request: the story says that request is the same `POST /webhook-received` delivered directly in step 1.
- Token validation on `POST /webhook-received` (`ValidateToken`) and the `OPTIONS /check` endpoint: unchanged by this bug.
- The registered webhooks section's content when signed in: unchanged; only its anonymous prompt is used as the reference wording in TC-BUG-50-01.

## Open questions

- Whether the token must also be absent from the raw HTML/Blazor payload served to an anonymous visitor (not only from what the page displays). The story says the page "shows" no message and no token; TC-BUG-50-01 checks the rendered page text only.
- What a signed-in user sees when no message has been received ("None yet received"): the in-memory repository is shared across the run, so an empty state cannot be guaranteed on the test stack, and the story only says signed-in display is unchanged.
- Whether a page left open while signing out, or a live update pushed to an anonymous circuit, may reveal messages: the story does not describe it.
