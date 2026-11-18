---
id: TC-HINT-1-12
type: happy
layer: e2e
covers: ["AC4: Token column shows the hint, never a whole token", "AC5: /add-webhook registration behaves as today"]
priority: P1
---

# TC-HINT-1-12: After registering on /add-webhook, the home page Token column shows "…" and the last 4 characters

## Why

- AC4 is the visible half of the story and AC5 says registering through the client still works; one journey through the real WebApp covers the client model, the razor binding and the API answer together, which only the e2e layer can.

## Preconditions

- Test stack up with scenario `hint-1`; signed in to the webhooks client as `alice` (`Pass123$`).
- The token typed below must equal the client's configured token, `WebhookClientOptions:Token`, when the stack enables token validation; the spec reads it from the stack configuration at run time and never hard-codes it. Call it `<client-token>`; `<hint>` is `"…"` plus its last 4 characters (or `"…"` alone if it has 4 or fewer).

## Steps

1. Open `/add-webhook`, clear the Token box (the page prefills it) and fill it with `<client-token>` so it holds exactly that value, click **Register**.
2. On the home page, read the **Registered webhooks** grid.

## Expected result

- Registration returns to the home page with no error message (as today).
- The grid has a new row whose Destination is the webhooks client's `/webhook-received` URL and whose Token cell text is exactly `<hint>`.
- The full text of the home page does not contain `<client-token>`.
