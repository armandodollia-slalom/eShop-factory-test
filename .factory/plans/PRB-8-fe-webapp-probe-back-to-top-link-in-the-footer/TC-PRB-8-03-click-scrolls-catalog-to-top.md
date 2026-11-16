---
id: TC-PRB-8-03
type: happy
layer: e2e
covers: ["AC2: page scrolled to its top", "AC2: header visible", "AC2: without leaving the page"]
priority: P1
---

# TC-PRB-8-03: Clicking "Back to top" at the bottom of the catalog scrolls to the top and shows the header on the same page

## Why

- This is the story's core behaviour (AC2). The Implementation Notes record two traps: the sticky header never counts as out of view, and `<base href="/">` can redirect a bare fragment; a regression in either leaves the page unscrolled or navigates away. Only a real browser scroll shows it, so the case is e2e.

## Preconditions

- Test stack running with scenario `default` (101 catalog items, so the catalog page is taller than the viewport); anonymous shopper; default Playwright viewport.

## Steps

1. Open `/` and wait for the first catalog item card to render.
2. Scroll to the bottom of the page (`window.scrollTo(0, document.body.scrollHeight)`) and confirm `window.scrollY` is greater than 0 and the footer's `Back to top` link is in the viewport.
3. Click the footer link `Back to top`.

## Expected result

- Within 5 seconds `window.scrollY` is `0`.
- The header (`header.eshop-topbar`) is in the viewport and its `Shop all` navigation link is visible.
- The URL path is still `/` with no query string (only a `#top` fragment may be added); no navigation to another route happened.
- The first catalog item card rendered before the click is still on the page (the catalog was not reloaded to a different page).
