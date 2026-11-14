---
id: TC-BUG-12-07
type: happy
layer: e2e
covers: ["Decisions: a missing page is treated as page 1"]
priority: P2
---

# TC-BUG-12-07: No page parameter shows the first page

## Why

- A missing ?page= is the default path through GetValueOrDefault(1); it must still equal page 1 after the clamp is added.

## Preconditions

- Test stack running with scenario `default` (101 catalog items, page size 9, so 12 pages; page 12 holds 2 items).
- Anonymous visitor (no sign-in needed; catalog reads are anonymous).

## Steps

1. Open `http://localhost:18080/`.
2. Read the product names in order.
3. Open `http://localhost:18080/?page=1` and read the names.

## Expected result

- Exactly 9 `.catalog-product` cards, no `.catalog-card-skeleton`, no error bar.
- The names equal, in order, the names from `?page=1`.
- `.page-status` text is `1 / 12`.
