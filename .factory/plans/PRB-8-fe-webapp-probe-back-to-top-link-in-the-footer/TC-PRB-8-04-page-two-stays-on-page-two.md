---
id: TC-PRB-8-04
type: sad
sad-path: boundary
layer: e2e
covers: ["AC2: without leaving the page", "Implementation Notes: href is current base-relative URI plus #top"]
priority: P1
---

# TC-PRB-8-04: "Back to top" on catalog page 2 keeps the shopper on page 2 instead of the home page

## Why

- AC2 says the click must not leave the page. With `<base href="/">`, a bare `#top` resolves to `/#top`, which from a catalog page with a query string (`?page=2`) would drop the shopper back on page 1. Page 1 at `/` cannot reveal that bug because `/#top` is the same page, so this boundary needs its own case.

## Preconditions

- Test stack running with scenario `default` (101 items, 9 per page, so page 2 exists); anonymous shopper.

## Steps

1. Open `/?page=2` and note the names of the catalog item cards shown.
2. Scroll to the bottom of the page and confirm `window.scrollY` is greater than 0.
3. Click the footer link `Back to top`.

## Expected result

- The link's `href` attribute before the click is `?page=2#top`.
- Within 5 seconds `window.scrollY` is `0` and `header.eshop-topbar` is in the viewport.
- The URL path is `/` and the query string is still `?page=2`.
- The catalog shows the same item cards noted in step 1 (page 2, not page 1).
