---
id: TC-BUG-52-02
type: sad
sad-path: validation
layer: e2e
covers: ["Expected: no webhook is registered", "Implementation Notes: empty token -> no POST"]
priority: P1
---

# TC-BUG-52-02: Register with an empty Token box registers no webhook

## Why

- The ticket requires that an empty token registers nothing; if the guard were removed, the page could send a subscription with an empty token to the Webhooks API. Checked at e2e because the trigger is the page's form; the page is server-rendered Blazor, so the request would leave the server, not the browser; the outcome is therefore checked in the user's registered-webhooks list on the home page and through the Webhooks API.

## Preconditions

- Test stack running with scenario `default`: user `alice` (password `Pass123$`), no webhook subscriptions.
- A browser context signed in to the webhooks client as `alice`.

## Steps

1. Navigate to `<webhooksclient>/add-webhook`.
2. Clear the Token box.
3. Click `Register` and wait until the `error-message` paragraph is visible.
4. Navigate to the webhooks client home page `<webhooksclient>/`.
5. As `alice` (bearer token for scope `webhooks`), send `GET <webhooks>/api/webhooks?api-version=1.0`.

## Expected result

- After step 4 the registered-webhooks section of the home page shows `None registered`.
- Step 5 returns `200` with the body `[]`.
