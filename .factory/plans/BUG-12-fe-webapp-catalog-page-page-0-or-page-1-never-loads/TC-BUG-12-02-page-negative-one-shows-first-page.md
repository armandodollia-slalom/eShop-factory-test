---
id: TC-BUG-12-02
type: sad
sad-path: boundary
layer: e2e
covers: ["Expected: first catalog page is shown", "Steps to Reproduce: ?page=-1", "Technical Notes: clamp Page to at least 1"]
priority: P1
---

# TC-BUG-12-02: ?page=-1 shows the first catalog page

## Why

- Second reported repro. A negative page produced pageIndex=-2 before the fix; this is the negative side of the clamp, a separate input from zero.

## Preconditions

- Test stack running with scenario `default` (101 catalog items, page size 9, so 12 pages; page 12 holds 2 items).
- Anonymous visitor (no sign-in needed; catalog reads are anonymous).

## Steps

1. Open `http://localhost:18080/?page=-1`.
2. Wait for the `.catalog-product` cards to be visible.
3. Read the product names in order.
4. In a second navigation open `http://localhost:18080/?page=1` and read the names.

## Expected result

- Exactly 9 `.catalog-product` cards are visible.
- No `.catalog-card-skeleton` element remains in the DOM.
- The error bar "An unhandled error has occurred." is not visible.
- The names equal, in order, the names from `?page=1`.
- The browser URL is still `http://localhost:18080/?page=-1`.
