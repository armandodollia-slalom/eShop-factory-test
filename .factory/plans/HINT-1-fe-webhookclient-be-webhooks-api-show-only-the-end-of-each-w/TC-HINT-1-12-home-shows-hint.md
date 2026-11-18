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
- The stack's webhooks client does not validate tokens (`ValidateToken` unset), so the grant check accepts a token made up for the test: `fake-token-hint-7e2f`. Its hint is `"…7e2f"`.
- The page prefills the Token box with the client's own configured token (`WebhookClientOptions:Token`); the story says that value is shown nowhere new, so the spec keeps the box's text invisible until it has replaced it, and no recording frame shows it.

## Steps

1. Open `/add-webhook`, clear the Token box, type `fake-token-hint-7e2f`, click **Register**.
2. On the home page, read the **Registered webhooks** grid.

## Expected result

- Registration returns to the home page with no error message (as today).
- The grid has a new row whose Destination is the webhooks client's `/webhook-received` URL and whose Token cell text is exactly `"…7e2f"`.
- The full text of the home page does not contain `fake-token-hint-7e2f`.
