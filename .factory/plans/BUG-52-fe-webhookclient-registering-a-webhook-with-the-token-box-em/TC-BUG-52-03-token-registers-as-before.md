---
id: TC-BUG-52-03
type: happy
layer: e2e
covers: ["Expected: Register with a token in the box behaves exactly as today", "Implementation Notes: token present -> navigate home on success"]
priority: P1
---

# TC-BUG-52-03: Register with a token registers the webhook and returns to the home page as before

## Why

- The fix must not change the path with a token: success still registers the `OrderPaid` webhook and navigates home. A regression here (for example the guard firing for a filled box, or a stale message blocking submit) would break the client's only registration flow, which only the browser flow on the test stack exercises end to end (page -> Webhooks API -> grant check against the client's `/check`).

## Preconditions

- Test stack running with scenario `default`: user `alice` (password `Pass123$`), no webhook subscriptions.
- A browser context signed in to the webhooks client as `alice`.

## Steps

1. Navigate to `<webhooksclient>/add-webhook`.
2. Clear the Token box and type `bug52-token`.
3. Click `Register`.
4. As `alice` (bearer token for scope `webhooks`), send `GET <webhooks>/api/webhooks?api-version=1.0`.
5. Read the `Subscriptions` table of the Webhooks database.

## Expected result

- After step 3 the browser is on the webhooks client home page (`/`), not `/add-webhook`.
- No `error-message` paragraph with text `A token is needed to register a webhook.` is shown.
- The registered-webhooks grid on the home page shows exactly one row whose Destination is `http://webhooksclient:8080/webhook-received` and whose Token column is the hint `…oken` (since HINT-1 the grid shows only the end of the token, never `bug52-token` itself).
- Step 4 returns `200` with exactly one subscription: `tokenHint` `…oken`, `destUrl` `http://webhooksclient:8080/webhook-received`, `type` `3` (OrderPaid); the subscription has no `token` property.
- Step 5 shows exactly one `Subscriptions` row with the same id as the API's subscription, `Token` `bug52-token`, `DestUrl` `http://webhooksclient:8080/webhook-received`, `Type` `3`.
