---
id: TC-PRB-10-01
type: happy
layer: e2e
covers: ["Expected: on the catalog page the header's Shop all link has aria-current=\"page\"", "Steps to Reproduce 1-2"]
priority: P1
---

# TC-PRB-10-01: "Shop all" has aria-current="page" on the catalog page

## Why

- This is the bug itself: on the catalog the link is styled as current but a screen reader is not told so. It needs the rendered page in a browser, so it is an e2e case; no cheaper layer renders the Blazor header with the endpoint metadata that decides the current page.

## Preconditions

- Test stack running with scenario `default` (demo catalog of 101 items).
- Anonymous browser session (no sign-in needed; the catalog is public).

## Steps

1. Open the store's home page `/` (full page load).
2. Locate the link with accessible name "Shop all" inside `header nav[aria-label="Primary"]`.

## Expected result

- Exactly one link named "Shop all" exists in the primary navigation.
- Its `aria-current` attribute is exactly `page`.
- Playwright's accessibility check `getByRole('link', { name: 'Shop all', current: 'page' })` within the primary navigation finds that link (count 1).
