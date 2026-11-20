---
id: TC-BUG-52-01
type: sad
sad-path: validation
layer: e2e
covers: ["Expected: after step 4 the page says, next to the form, that a token is needed to register a webhook", "Steps to Reproduce 1-4", "Actual (regression: no message shown)"]
priority: P1
---

# TC-BUG-52-01: Register with an empty Token box shows "A token is needed to register a webhook." next to the form

## Why

- This is the bug itself: before the fix, Register with an empty Token box changed nothing on the page. It must run through the browser (e2e) because the defect is what the user sees after a click in a Blazor page; no API or unit layer reaches the rendered message. Kept separate from TC-BUG-52-02 so a missing message and an unwanted registration fail as distinct cases.

## Preconditions

- Test stack running with scenario `default`: user `alice` (password `Pass123$`), no webhook subscriptions.
- A browser context signed in to the webhooks client as `alice` (open the webhooks client, follow its sign-in to Identity, enter `alice` / `Pass123$`, click Login, land back on the webhooks client home page).

## Steps

1. Navigate to `<webhooksclient>/add-webhook`.
2. Clear the Token box (placeholder `Token`) so its value is the empty string.
3. Click the `Register` button.

## Expected result

- The URL is still `/add-webhook` (the page does not navigate to the home page).
- A paragraph with class `error-message` is visible, positioned below the `Register` button of the form, with the exact text `A token is needed to register a webhook.`.
- The heading `Register a new webhook`, the Token box (still empty) and the `Register` button are still shown.
- No text starting with `Registation was rejected` is shown.
