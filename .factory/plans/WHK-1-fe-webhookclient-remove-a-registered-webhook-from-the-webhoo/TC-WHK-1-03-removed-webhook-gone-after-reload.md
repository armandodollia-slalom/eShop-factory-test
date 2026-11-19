---
id: TC-WHK-1-03
type: happy
layer: e2e
covers: ["AC1: after a reload the removed webhook is still gone", "Outputs: Remove deletes the subscription through Webhooks.API"]
priority: P1
---

# TC-WHK-1-03: A removed webhook is still gone after the page is reloaded

## Why

- AC1 requires the deletion to be persisted in Webhooks.API, not just hidden in the page; a client that only filters its local list would pass TC-WHK-1-02 and fail here. e2e because the reload path (client loads `GET /api/webhooks` as the signed-in user) is what the user sees.

## Preconditions

- Scenario `whk-1` is loaded: users `alice` and `bob` (password `Pass123$`), no webhook subscriptions.
- Signed in to the WebhookClient as `alice`.
- Alice registered two webhooks through `/add-webhook`: Token `whk1-03-keep` and Token `whk1-03-remove`.
- `/` is open and shows both rows.

## Steps

1. Click the `Remove` button on the row whose Token is `whk1-03-remove` and wait until that row is no longer in the grid.
2. Reload the page (`page.reload()`).

## Expected result

- After the reload the grid has exactly 1 data row, with Token `whk1-03-keep`.
- No row with Token `whk1-03-remove` is shown.
