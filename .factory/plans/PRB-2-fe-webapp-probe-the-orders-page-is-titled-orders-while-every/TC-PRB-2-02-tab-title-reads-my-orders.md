---
id: TC-PRB-2-02
type: happy
layer: e2e
covers: ["Expected: tab title is \"My orders | AdventureWorks\"", "Steps to Reproduce 3", "Acceptance Criteria"]
priority: P1
---

# TC-PRB-2-02: The orders page's browser tab title is "My orders | AdventureWorks"

## Why

- The second half of the bug is the document title ("Orders | AdventureWorks"); it is set by `PageTitle` and is a separate observable from the heading, so it gets its own case. Only a browser exposes `document.title`, so the layer is e2e.

## Preconditions

- Test stack running with scenario `default`.
- Signed in to the WebApp as `alice` / `Pass123$`.
- Browser is on the catalog home page `/`.

## Steps

1. Hover the header button with accessible name "Account" to open the user menu.
2. Click the link "My orders" in the user menu.
3. Read the page title (`document.title`).

## Expected result

- The page title is exactly `My orders | AdventureWorks`.
