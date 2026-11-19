---
id: TC-INSTK-1-11
type: happy
layer: e2e
covers: ["AC2: a reload or a shared link shows the same list"]
priority: P1
---

# TC-INSTK-1-11: A reload or a shared link with inStock=true shows the same filtered list

## Why

- AC2 requires the choice to live in the URL so that a reload or a link opened by someone else reproduces it. The page reads it from the query string on first render, which only a fresh navigation in a real browser exercises.

## Preconditions

- Test stack running scenario `instk-1`.
- A new browser context with no cookies or storage (stands in for the person receiving the link).

## Steps

1. In the new context, open `/?inStock=true` directly.
2. Reload the page.

## Expected result

- After step 1 and again after step 2: "In stock only" shows its active state, the toolbar reads "90 products", the pager's last page number is 10, and the address bar still contains `inStock=true`.
- After step 2, no card on the page shows any of the 11 out-of-stock item names listed in `_index.md`.
