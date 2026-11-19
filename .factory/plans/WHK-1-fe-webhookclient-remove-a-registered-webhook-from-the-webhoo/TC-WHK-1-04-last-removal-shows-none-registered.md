---
id: TC-WHK-1-04
type: happy
layer: e2e
covers: ["AC2", "Outputs: when the last webhook is removed the list shows None registered"]
priority: P1
---

# TC-WHK-1-04: Removing the last webhook shows None registered

## Why

- AC2 requires the empty state to appear as soon as the last row is removed, in the same page; a component that keeps an empty grid instead of switching to the `None registered` placeholder would break it. e2e because the placeholder is rendered UI.

## Preconditions

- Scenario `whk-1` is loaded: users `alice` and `bob` (password `Pass123$`), no webhook subscriptions.
- Signed in to the WebhookClient as `alice`.
- Alice registered one webhook through `/add-webhook` with Token `whk1-04-only`.
- `/` is open and shows that one row.

## Steps

1. Click the `Remove` button on the row whose Token is `whk1-04-only`.

## Expected result

- The registered webhooks section shows the text `None registered`.
- No grid row and no `Remove` button is shown.
- The page URL is still `/`.
