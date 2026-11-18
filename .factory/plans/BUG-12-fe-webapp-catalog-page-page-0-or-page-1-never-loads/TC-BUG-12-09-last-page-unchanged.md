---
id: TC-BUG-12-09
type: happy
layer: e2e
covers: ["Technical Notes: pageIndex = Page - 1 for valid pages"]
priority: P3
---

# TC-BUG-12-09: ?page=12 shows the last page with 2 items

## Why

- Checks the upper valid boundary still works after the change (101 items, 9 per page, so page 12 has 2).

## Preconditions

- Test stack running with scenario `default` (101 catalog items, page size 9, so 12 pages; page 12 holds 2 items).
- Anonymous visitor (no sign-in needed; catalog reads are anonymous).

## Steps

1. Open `http://localhost:18080/?page=12`.

## Expected result

- Exactly 2 `.catalog-product` cards, no error bar.
- `.page-status` text is `12 / 12` and no `a.page-nav[rel="next"]` exists.
