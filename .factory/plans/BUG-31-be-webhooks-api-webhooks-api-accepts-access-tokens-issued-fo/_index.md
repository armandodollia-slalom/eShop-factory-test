---
story: BUG-31
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/103"
story-sha: feee67487cdb
plan-sha: 41f81c8fe919
verified-score: 10
verified-at: "2026-11-15T02:54:46.564Z"
verified-by: test-planner@aebddb93/f37226b9
automation-sha: 1ac168986ff4
automation-plan-sha: 41f81c8fe919
automation-score: 10
automation-verified-at: "2026-11-15T03:05:26.208Z"
---
# Test plan: BUG-31 Webhooks.API accepts access tokens issued for other APIs

Scope: Webhooks.API must accept only access tokens that carry the `webhooks` scope. A token Identity.API issued for another API (scope `basket` only) must be refused on every endpoint of `/api/webhooks` (`GET` list, `GET` by id, `POST`, `DELETE`) and must not list, create or delete a subscription. Tokens with the `webhooks` scope, including the session the WebhookClient app gets at sign-in, keep working. Every case runs on the test stack (scenario `bug-31`, which `extends: default` with no extra rows: alice and bob, `Pass123$`, no webhook subscriptions) with real access tokens from Identity.API, because the acceptance criterion is to repeat the reproduction steps on the test stack and the defect lies in how a real JWT's `scope` claim is judged, which the functional tests' fake authentication middleware does not exercise.

Shared setup used by the cases:

- **Basket token**: sign in as `alice` / `Pass123$` at Identity.API `/connect/authorize` with `client_id=basketswaggerui`, `response_type=token`, `scope=basket`, `redirect_uri=http://basket-api:8080/swagger/oauth2-redirect.html`; read `access_token` from the fragment of the `302` Location returned by `/connect/authorize/callback`. Its decoded payload has `scope` equal to `basket` (no `webhooks`).
- **Webhooks token**: the same flow with `client_id=webhooksswaggerui`, `scope=webhooks`, `redirect_uri=http://webhooks-api:8080/swagger/oauth2-redirect.html`. Its decoded payload has `scope` equal to `webhooks`.
- **Subscription body**: `{"url":"http://webhooksclient:8080/webhook-received","grantUrl":"http://webhooksclient:8080/check","token":"secret","event":"OrderPaid"}` (the stack's WebhookClient `/check` endpoint echoes the grant token, so the grant check passes).

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-31-01 | A webhooks-scoped token can create, list, read and delete alice's subscription | happy | e2e | Expected: a token with the webhooks scope keeps working |
| TC-BUG-31-02 | WebhookClient app registers a webhook and lists it after alice signs in | happy | e2e | Expected: the webhooks client app's token keeps working |
| TC-BUG-31-03 | Basket-only token is refused on GET /api/webhooks and lists nothing | sad | e2e | Steps to Reproduce step 2; Expected: refused, nothing listed |
| TC-BUG-31-04 | Basket-only token is refused on GET /api/webhooks/{id} | sad | e2e | Expected: refused on every endpoint |
| TC-BUG-31-05 | Basket-only token is refused on POST /api/webhooks and nothing is created | sad | e2e | Expected: refused, nothing created |
| TC-BUG-31-06 | Basket-only token is refused on DELETE /api/webhooks/{id} and the subscription survives | sad | e2e | Steps to Reproduce step 3; Expected: refused, nothing deleted |
| TC-BUG-31-07 | Request without a token is refused with 401 | sad | e2e | Expected: refusal on every endpoint (anonymous caller) |

## Out of scope

- "Changed" in the Expected section: Webhooks.API has no update endpoint (`GET`, `GET /{id}`, `POST`, `DELETE` only), so there is nothing to change; `POST` and `DELETE` cover the writes.
- Audience validation in `src/eShop.ServiceDefaults` and token issuing in `src/Identity.API`: unchanged by this fix.
- Functional-layer cases for the `scope` claim formats the implementation accepts (one `scope` claim per scope, or one `scope` claim with a space-separated value): these are implementation details from the notes, not requirements of the ticket; the real tokens in TC-01, TC-02 and TC-03 to TC-06 exercise the form Identity.API actually issues.
- Ownership (bob reading alice's subscription) and validation of the subscription body: unchanged by this bug and covered by existing tests.

## Open questions

- The ticket allows `401` or `403` for a token without the `webhooks` scope. Cases TC-03 to TC-06 assert `403`, the status the implementation notes record for an authenticated token that lacks the scope; a `401` would also satisfy the ticket's wording.
- The response body of a refusal is not specified; cases assert only that it does not contain subscription data.
- A token carrying both `basket` and `webhooks` scopes is not described by the ticket ("tokens that carry the `webhooks` scope" suggests acceptance); no case written.
