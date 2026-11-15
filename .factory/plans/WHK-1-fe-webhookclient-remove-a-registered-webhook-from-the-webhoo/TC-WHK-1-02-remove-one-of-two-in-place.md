---
id: TC-WHK-1-02
type: happy
layer: e2e
covers: ["AC1: that row disappears, the other row stays", "Outputs: row disappears without leaving the page, other rows stay"]
priority: P1
---

# TC-WHK-1-02: Removing one of two webhooks removes its row in place and keeps the other

## Why

- AC1 is the core behaviour: clicking `Remove` must drop exactly that row without navigating away, and must not touch the neighbouring row. A bug that filters the wrong id, clears the whole list or forces a navigation would break it. e2e because "without leaving the page" is only observable in the browser.

## Preconditions

- Scenario `whk-1` is loaded: users `alice` and `bob` (password `Pass123$`), no webhook subscriptions.
- Signed in to the WebhookClient as `alice`.
- Alice registered two webhooks through `/add-webhook`: Token `whk1-02-keep` and Token `whk1-02-remove`.
- `/` is open and shows both rows.

## Steps

1. Record the page URL.
2. Click the `Remove` button on the row whose Token is `whk1-02-remove`.

## Expected result

- The row with Token `whk1-02-remove` is no longer in the grid.
- The row with Token `whk1-02-keep` is still in the grid, and the grid has exactly 1 data row.
- The page URL equals the URL recorded in step 1 and no full page load happened (no `load` event fired after the click).
- No `role="alert"` element with text `This webhook no longer exists.` is shown.
