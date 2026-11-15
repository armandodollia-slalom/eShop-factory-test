---
id: TC-WHK-1-01
type: happy
layer: e2e
covers: ["Inputs: Remove button, one per registered webhook", "Outputs: each row has a button labeled exactly Remove"]
priority: P1
---

# TC-WHK-1-01: Each registered webhook row has exactly one button labeled Remove

## Why

- The story's only input is a `Remove` button on every row of the registered webhooks list; if a row lacks it, or the label differs, users cannot remove that webhook and AC1 to AC4 cannot be exercised. It is a separate case because it checks rendering, not deletion; e2e because the button only exists in the rendered Blazor page.

## Preconditions

- Scenario `whk-1` is loaded: users `alice` and `bob` (password `Pass123$`), no webhook subscriptions.
- Signed in to the WebhookClient (`/`) as `alice` via `Log in`.
- Alice registered two webhooks through `/add-webhook`: first with Token `whk1-01-a`, then with Token `whk1-01-b` (each: fill Token, click `Register`, lands back on `/`).

## Steps

1. Open `/` on the WebhookClient as `alice`.

## Expected result

- The registered webhooks grid shows exactly 2 data rows, one with Token `whk1-01-a` and one with Token `whk1-01-b`.
- Each of the 2 rows contains exactly one `button` whose text is exactly `Remove`.
- The page contains exactly 2 buttons named `Remove`.
