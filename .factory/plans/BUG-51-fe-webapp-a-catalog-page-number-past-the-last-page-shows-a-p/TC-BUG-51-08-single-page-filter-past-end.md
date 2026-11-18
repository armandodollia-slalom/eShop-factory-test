---
id: TC-BUG-51-08
type: sad
sad-path: boundary
layer: e2e
covers: ["Expected bullet 2: pager never above the number of pages (filter with a single page)"]
priority: P2
---

# TC-BUG-51-08: A one-page brand filter with a page past the end shows its products and no pager

## Why

- When the filtered result fits on one page, the last page is page 1 and the page shows no pager today. Without the fix, a page past the end would show the count above an empty area; this is the smallest non-empty last page.

## Preconditions

- Test stack running with scenario `default`: brand 7 (Solstix) has exactly 9 products, one page.
- Anonymous browser session.

## Steps

1. Open `/?brand=7&page=3` on the WebApp.

## Expected result

- The toolbar reads "9 products".
- The product area lists exactly 9 products.
- No pager is rendered (no "Catalog pages" navigation), as on `/?brand=7`; the text "3 / 1" does not appear.
