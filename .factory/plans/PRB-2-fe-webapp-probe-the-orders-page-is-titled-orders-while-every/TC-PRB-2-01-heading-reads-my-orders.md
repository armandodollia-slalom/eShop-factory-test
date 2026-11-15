---
id: TC-PRB-2-01
type: happy
layer: e2e
covers: ["Expected: heading reads \"My orders\"", "Steps to Reproduce 1-3", "Acceptance Criteria"]
priority: P1
---

# TC-PRB-2-01: Opening "My orders" from the user menu shows the page heading "My orders"

## Why

- The bug is that the page header says "Orders" while the user-menu link says "My orders"; this case repeats the ticket's exact reproduction path (user menu, not a direct URL) and checks the heading text. It must be e2e because the heading is rendered by the WebApp layout's `page-header-title` section outlet and only exists in the browser.

## Preconditions

- Test stack running with scenario `default` (alice has no orders).
- Signed in to the WebApp as `alice` / `Pass123$`.
- Browser is on the catalog home page `/`.

## Steps

1. Hover the header button with accessible name "Account" to open the user menu.
2. Click the link "My orders" in the user menu.

## Expected result

- The URL ends with `/user/orders`.
- The page header `h1` (the `page-header-title` outlet in the header bar) has the exact text `My orders`.
- No `h1` on the page has the exact text `Orders`.
