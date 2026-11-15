---
id: TC-WHK-1-07
type: sad
sad-path: not-found
layer: e2e
covers: ["AC4", "Outputs: subscription no longer exists -> message exactly This webhook no longer exists. and the list is reloaded"]
priority: P1
---

# TC-WHK-1-07: Removing a webhook already deleted in another tab shows This webhook no longer exists. and reloads the list

## Why

- AC4 covers a stale page: the row is still shown but Webhooks.API no longer has the subscription. The page must show the exact message and reload the list instead of failing silently or showing a general error. A second tab of the same signed-in session deletes it through Webhooks.API, which is the story's own example. e2e because both the message and the reloaded list are rendered UI.

## Preconditions

- Scenario `whk-1` is loaded: users `alice` and `bob` (password `Pass123$`), no webhook subscriptions.
- Signed in to the WebhookClient as `alice`.
- Alice registered two webhooks through `/add-webhook`: Token `whk1-07-stale` and Token `whk1-07-keep`.
- Tab 1 has `/` open and shows both rows.

## Steps

1. In tab 2 of the same browser context, open `/` and click the `Remove` button on the row whose Token is `whk1-07-stale`; wait until that row is gone from tab 2.
2. In tab 1 (not reloaded), click the `Remove` button on the row whose Token is `whk1-07-stale`.

## Expected result

- Tab 1 shows an element with `role="alert"` whose text is exactly `This webhook no longer exists.`
- Tab 1's grid no longer shows the row with Token `whk1-07-stale`.
- Tab 1's grid has exactly 1 data row, with Token `whk1-07-keep`.
- Tab 1's URL is still `/`.
