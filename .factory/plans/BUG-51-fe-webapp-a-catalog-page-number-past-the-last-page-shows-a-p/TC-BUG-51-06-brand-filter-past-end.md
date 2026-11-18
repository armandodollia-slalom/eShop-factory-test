---
id: TC-BUG-51-06
type: sad
sad-path: boundary
layer: e2e
covers: ["Expected bullet 2: with a brand filter", "Expected bullet 3: brand-filtered catalog behaves as today"]
priority: P1
---

# TC-BUG-51-06: A brand filter past its last page shows that filter's last page

## Why

- The ticket says the pager must stay in range "with or without a brand or type filter", so the last page must be computed from the filtered count (2 pages), not the whole catalog's (12). Step 1 also pins the filtered in-range page as unchanged. E2e because the filter and page come from the address.

## Preconditions

- Test stack running with scenario `default`: brand 2 (Gravitator) has 11 products, so 2 pages (9 + 2).
- Anonymous browser session.

## Steps

1. Open `/?brand=2&page=2` and record the names of the listed products.
2. Open `/?brand=2&page=5` on the WebApp.

## Expected result

- Step 1: the toolbar reads "11 products", 2 products are listed, the pager status reads "2 / 2".
- Step 2: the toolbar reads "11 products"; exactly 2 products are listed, with the same names as step 1; the pager status reads "2 / 2" with 2 as the active page and "Next" disabled.
- Step 2: the text "5 / 2" does not appear, and the brand filter Gravitator stays selected.
