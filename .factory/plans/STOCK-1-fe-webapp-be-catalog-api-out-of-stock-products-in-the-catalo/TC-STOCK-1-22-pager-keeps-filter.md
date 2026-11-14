---
id: TC-STOCK-1-22
type: happy
layer: e2e
covers: ["Inputs: In stock only kept in the page URL with the page parameter", "Outputs: page count matches"]
priority: P1
---

# TC-STOCK-1-22: With "In stock only" checked, clicking pager link 2 keeps onlyAvailable=true

## Why

- The Inputs say the checkbox state is kept in the URL together with the page parameter. TC-14 opens a hand-built URL, so it does not prove that the catalog's own pager links carry `onlyAvailable=true`; if they dropped it, page 2 would silently show the unfiltered catalog. Only the rendered page and its links show this, so e2e.

## Preconditions

- Test stack scenario `stock-1` (new, `extends: default`): item 1 "Wanderer Black Hiking Boots" (brand 1 Daybird) and item 2 "Summit Pro Harness" (brand 2 Gravitator) have `AvailableStock` 0; items 3 to 101 keep `AvailableStock` 100. The catalog page shows 9 products per page, ordered by name.
- Anonymous visitor.

## Steps

1. Open `/`.
2. Check the `In stock only` checkbox and wait for the page to reload with `onlyAvailable=true` in the URL.
3. Click the pager link with the text `2`.

## Expected result

- The URL query contains both `onlyAvailable=true` and `page=2`.
- The `In stock only` checkbox is checked.
- The active page number (`aria-current="page"`) is `2`.
- The pager's highest page number is 11 (99 in-stock products), not 12.
- Exactly 9 product cards are listed; the first is titled `Ascend XT Trail Running Shoes`.
