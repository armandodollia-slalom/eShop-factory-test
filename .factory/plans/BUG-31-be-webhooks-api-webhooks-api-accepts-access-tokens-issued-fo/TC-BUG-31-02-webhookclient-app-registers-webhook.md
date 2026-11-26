---
id: TC-BUG-31-02
type: happy
layer: e2e
covers: ["Expected: the token the webhooks client app gets when a user signs in keeps working"]
priority: P1
---

# TC-BUG-31-02: WebhookClient app registers a webhook and lists it after alice signs in

## Why

- The ticket names the WebhookClient app's sign-in token (client `webhooksclient`, code flow, scopes `openid webhooks`) as the one that must keep working. It is a different client and flow from TC-01's, and it is only reachable through the WebhookClient UI on the test stack, so this case is e2e through the browser.

## Preconditions

- Test stack up with scenario `bug-31`; alice has no webhook subscriptions.
- Browser at the WebhookClient app `{webhooksclient}/`, not signed in.

## Steps

1. Click the `Log in` button, then on the Identity login page fill `Username` = `alice`, `Password` = `Pass123$` and click `Login`.
2. Navigate to `{webhooksclient}/add-webhook`.
3. Leave the `Token` field at its default `6168DB8D-DC58-4094-AF24-483278923590` and click `Register`.

## Expected result

- After step 3 the browser is back on `{webhooksclient}/` and no `.error-message` element is shown.
- The grid under the heading `Registered webhooks` has exactly one row, with Destination `http://webhooksclient:8080/webhook-received` and Token `6168DB8D-DC58-4094-AF24-483278923590`.
