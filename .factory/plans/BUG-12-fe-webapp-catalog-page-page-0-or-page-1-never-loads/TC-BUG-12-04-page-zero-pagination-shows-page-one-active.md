---
id: TC-BUG-12-04
type: sad
sad-path: boundary
layer: e2e
covers: ["Code map: pagination bar shows page 1 active with Prev disabled"]
priority: P1
---

# TC-BUG-12-04: ?page=0 pagination bar shows page 1 active with Previous disabled

## Why

- The fix also changes the pagination block to use CurrentPage; without it the bar would compute page 0 and render wrong numbers or an enabled Previous link. Checked separately from the item list.

## Preconditions

- Test stack running with scenario `default` (101 catalog items, page size 9, so 12 pages; page 12 holds 2 items).
- Anonymous visitor (no sign-in needed; catalog reads are anonymous).

## Steps

1. Open `http://localhost:18080/?page=0`.
2. Wait for `nav.catalog-pagination` to be visible.

## Expected result

- `.page-status` text is `1 / 12` (non-breaking spaces around the slash).
- `.page-number.active-page` is exactly one element with text `1`.
- The Previous control is the `span.page-nav.is-disabled` with `aria-disabled="true"`; there is no `a.page-nav[rel="prev"]`.
- `a.page-nav[rel="next"]` is present with an href containing `page=2`.
