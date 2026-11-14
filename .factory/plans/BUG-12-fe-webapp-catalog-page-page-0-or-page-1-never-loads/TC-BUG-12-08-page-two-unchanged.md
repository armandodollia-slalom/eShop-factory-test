---
id: TC-BUG-12-08
type: happy
layer: e2e
covers: ["Technical Notes: pageIndex = Page - 1 for valid pages"]
priority: P1
---

# TC-BUG-12-08: ?page=2 shows the second page, different from the first

## Why

- Guards against over-clamping (for example always returning page 1): valid pages above 1 must still map to pageIndex Page-1.

## Preconditions

- Test stack running with scenario `default` (101 catalog items, page size 9, so 12 pages; page 12 holds 2 items).
- Anonymous visitor (no sign-in needed; catalog reads are anonymous).

## Steps

1. Open `http://localhost:18080/?page=1` and read the product names in order.
2. Open `http://localhost:18080/?page=2` and read the product names in order.

## Expected result

- `?page=2` shows exactly 9 `.catalog-product` cards and no error bar.
- None of the 9 names on `?page=2` appears among the names on `?page=1`.
- `.page-status` text is `2 / 12`, `.page-number.active-page` has text `2`, and `a.page-nav[rel="prev"]` has an href with no `page=` query (page 1 link).
