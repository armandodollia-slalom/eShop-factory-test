---
id: TC-BUG-12-03
type: sad
sad-path: boundary
layer: e2e
covers: ["Technical Notes: clamp Page to at least 1 (any value below 1)"]
priority: P2
---

# TC-BUG-12-03: ?page=-100 shows the first catalog page

## Why

- The clamp must hold for any value below 1, not only 0 and -1; guards against a fix that special-cases those two values.

## Preconditions

- Test stack running with scenario `default` (101 catalog items, page size 9, so 12 pages; page 12 holds 2 items).
- Anonymous visitor (no sign-in needed; catalog reads are anonymous).

## Steps

1. Open `http://localhost:18080/?page=-100`.
2. Wait for the `.catalog-product` cards to be visible.
3. Read the product names in order.
4. In a second navigation open `http://localhost:18080/?page=1` and read the names.

## Expected result

- Exactly 9 `.catalog-product` cards are visible and no `.catalog-card-skeleton` remains.
- The error bar "An unhandled error has occurred." is not visible.
- The names equal, in order, the names from `?page=1`.
