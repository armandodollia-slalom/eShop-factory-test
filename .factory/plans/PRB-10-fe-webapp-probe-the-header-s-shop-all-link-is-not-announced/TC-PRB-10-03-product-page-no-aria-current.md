---
id: TC-PRB-10-03
type: sad
sad-path: boundary
layer: e2e
covers: ["Expected: on a product page the link has no aria-current", "Steps to Reproduce 3"]
priority: P1
---

# TC-PRB-10-03: "Shop all" has no aria-current on a product page

## Why

- The story requires the attribute to be absent (not `false`, not empty) on non-catalog pages; announcing "current page" on a product page would be a new accessibility bug. Step 3 of the reproduction names the product page explicitly. e2e because the header is rendered per route on the server.

## Preconditions

- Test stack running with scenario `default`; catalog item 99 "Adventurer GPS Watch" exists.
- Anonymous browser session.

## Steps

1. Open `/item/99` directly (full page load).
2. Locate the "Shop all" link in `header nav[aria-label="Primary"]`.

## Expected result

- The page shows the product "Adventurer GPS Watch".
- The "Shop all" link exists and has no `aria-current` attribute (`getAttribute('aria-current')` returns `null`).
- `getByRole('link', { name: 'Shop all', current: 'page' })` within the primary navigation finds nothing (count 0).
