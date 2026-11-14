---
id: TC-BUG-12-06
type: happy
layer: e2e
covers: ["Decisions: page 1 behaviour unchanged"]
priority: P2
---

# TC-BUG-12-06: ?page=1 still shows the first page

## Why

- Regression guard: the clamp must not alter the lowest valid page.

## Preconditions

- Test stack running with scenario `default` (101 catalog items, page size 9, so 12 pages; page 12 holds 2 items).
- Anonymous visitor (no sign-in needed; catalog reads are anonymous).

## Steps

1. Open `http://localhost:18080/?page=1`.
2. Wait for the `.catalog-product` cards.

## Expected result

- Exactly 9 `.catalog-product` cards, no `.catalog-card-skeleton`, no error bar.
- `.page-status` text is `1 / 12` and the Previous control is disabled.
