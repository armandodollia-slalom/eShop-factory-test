---
id: TC-BUG-12-05
type: sad
sad-path: boundary
layer: e2e
covers: ["Code map: pagination bar shows page 1 active with Prev disabled"]
priority: P2
---

# TC-BUG-12-05: ?page=-1 pagination bar shows page 1 active with Previous disabled

## Why

- Negative values previously yielded current = -1 and a Previous link to page -2; this pins the pagination state for the negative input.

## Preconditions

- Test stack running with scenario `default` (101 catalog items, page size 9, so 12 pages; page 12 holds 2 items).
- Anonymous visitor (no sign-in needed; catalog reads are anonymous).

## Steps

1. Open `http://localhost:18080/?page=-1`.
2. Wait for `nav.catalog-pagination` to be visible.

## Expected result

- `.page-status` text is `1 / 12`.
- Exactly one `.page-number.active-page`, with text `1`.
- No `a.page-nav[rel="prev"]` exists; `span.page-nav.is-disabled` is present.
- `a.page-nav[rel="next"]` has an href containing `page=2`.
