---
id: TC-WHK-1-05
type: sad
sad-path: ownership
layer: e2e
covers: ["AC3", "Outputs: removing affects only the signed-in user's subscription"]
priority: P1
---

# TC-WHK-1-05: Alice removing her webhook leaves Bob's webhook registered

## Why

- AC3 protects other users' data: a remove that deleted by token or URL (all client registrations share the same destination URL) instead of the caller's subscription id would wipe Bob's webhook too. e2e because AC3 is phrased as two users of the client; TC-WHK-1-06 checks the API guard directly.

## Preconditions

- Scenario `whk-1` is loaded: users `alice` and `bob` (password `Pass123$`), no webhook subscriptions.
- In browser context A, signed in to the WebhookClient as `alice`; Alice registered one webhook through `/add-webhook` with Token `whk1-05-alice`.
- In a separate browser context B, signed in to the WebhookClient as `bob`; Bob registered one webhook through `/add-webhook` with Token `whk1-05-bob`.

## Steps

1. In context A, open `/` and click the `Remove` button on the row whose Token is `whk1-05-alice`.
2. In context A, wait until the page shows `None registered`.
3. In context B, open `/`.

## Expected result

- In context B the grid has exactly 1 data row, with Token `whk1-05-bob`, and it has a `Remove` button.
- In context B no `None registered` text is shown.
