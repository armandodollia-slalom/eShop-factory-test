---
id: TC-BUG-12-01
type: sad
sad-path: boundary
layer: e2e
covers: ["Expected: first catalog page is shown", "Steps to Reproduce: ?page=0", "Technical Notes: clamp Page to at least 1"]
priority: P1
---

# TC-BUG-12-01: ?page=0 shows the first catalog page

## Why

- This is the reported bug: ?page=0 made the WebApp request pageIndex=-1 and the page never finished loading. It runs at e2e because the failure is the rendered page, and 0 is the exact boundary just below the first valid page.

## Preconditions

- Test stack running with scenario `default` (101 catalog items, page size 9, so 12 pages; page 12 holds 2 items).
- Anonymous visitor (no sign-in needed; catalog reads are anonymous).

## Steps

1. Open `http://localhost:18080/?page=0`.
2. Wait for the `.catalog-product` cards to be visible.
3. Read the product names of all `.catalog-product` cards in order.
4. In a second navigation open `http://localhost:18080/?page=1` and read the product names the same way.

## Expected result

- At step 2 exactly 9 `.catalog-product` cards are visible.
- No `.catalog-card-skeleton` element remains in the DOM.
- The error bar "An unhandled error has occurred." is not visible.
- The product names from `?page=0` equal, in the same order, the names from `?page=1`.
- The browser URL is still `http://localhost:18080/?page=0` (no redirect).
