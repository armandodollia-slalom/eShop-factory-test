---
id: TC-BUG-51-07
type: sad
sad-path: boundary
layer: e2e
covers: ["Expected bullet 2: with a type filter", "Expected bullet 3: type-filtered catalog behaves as today"]
priority: P1
---

# TC-BUG-51-07: A type filter past its last page shows that filter's last page

## Why

- The ticket names the type filter separately from the brand filter; it is a separate query value and needs its own case. Type 3 has exactly 18 products, so its last page is full, which also checks the last-page computation when the count is an exact multiple of 9.

## Preconditions

- Test stack running with scenario `default`: type 3 (Ski/boarding) has 18 products, so 2 full pages.
- Anonymous browser session.

## Steps

1. Open `/?type=3&page=2` and record the names of the listed products.
2. Open `/?type=3&page=9` on the WebApp.

## Expected result

- Step 1: the toolbar reads "18 products", 9 products are listed, the pager status reads "2 / 2".
- Step 2: the toolbar reads "18 products"; exactly 9 products are listed, with the same names as step 1; the pager status reads "2 / 2" with 2 as the active page and "Next" disabled.
- Step 2: the text "9 / 2" does not appear, and the type filter Ski/boarding stays selected.
