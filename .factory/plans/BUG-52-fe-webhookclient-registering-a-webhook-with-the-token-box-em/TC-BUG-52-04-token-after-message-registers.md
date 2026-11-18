---
id: TC-BUG-52-04
type: happy
layer: e2e
covers: ["Expected: Register with a token in the box behaves exactly as today", "Expected: message for the empty Token box (recovery after it)"]
priority: P2
---

# TC-BUG-52-04: After the empty-token message, entering a token and registering succeeds

## Why

- The new message is state on the page; the ticket requires that Register with a token behaves exactly as today, including right after the user saw the message. If the message state blocked or altered the next submit, the user who follows the message's advice could not register. Only the browser flow shows this sequence.

## Preconditions

- Test stack running with scenario `default`: user `alice` (password `Pass123$`), no webhook subscriptions.
- A browser context signed in to the webhooks client as `alice`.

## Steps

1. Navigate to `<webhooksclient>/add-webhook`.
2. Clear the Token box and click `Register`; wait until the text `A token is needed to register a webhook.` is visible.
3. Type `bug52-retry` into the Token box.
4. Click `Register`.
5. Read the `Subscriptions` table of the Webhooks database.

## Expected result

- After step 4 the browser is on the webhooks client home page (`/`).
- The registered-webhooks grid shows exactly one row, with Token `…etry` (the HINT-1 hint of `bug52-retry`; the grid never shows the full token).
- The text `A token is needed to register a webhook.` is not shown.
- Step 5 shows exactly one `Subscriptions` row, with `Token` `bug52-retry`, `DestUrl` `http://webhooksclient:8080/webhook-received`, `Type` `3` (OrderPaid).
