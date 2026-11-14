---
id: TC-STOCK-1-12
type: happy
layer: e2e
covers: ["AC5", "Outputs: catalog shows only in-stock products, page count matches, URL carries onlyAvailable=true"]
priority: P1
---

# TC-STOCK-1-12: Checking "In stock only" adds onlyAvailable=true to the URL and the page count drops to 11

## Why

- AC5 and the Outputs: checking the box must filter the catalog, put `onlyAvailable=true` in the URL and make the pager match the filtered count (99 products → 11 pages instead of 12). Only the UI shows that the checkbox reaches the API.

## Preconditions

- Test stack scenario `stock-1` (new, `extends: default`): item 1 "Wanderer Black Hiking Boots" (brand 1 Daybird) and item 2 "Summit Pro Harness" (brand 2 Gravitator) have `AvailableStock` 0; items 3 to 101 keep `AvailableStock` 100. The catalog page shows 9 products per page, ordered by name.
- Anonymous visitor.

## Steps

1. Open `/`.
2. Check the `In stock only` checkbox.

## Expected result

- After the page reloads, the URL query contains `onlyAvailable=true`.
- The `In stock only` checkbox is checked.
- The pager's highest page number is 11.
