---
id: TC-STOCK-1-11
type: happy
layer: e2e
covers: ["Inputs: In stock only unchecked by default", "Outputs: checkbox labeled exactly In stock only beside brand and type filters"]
priority: P2
---

# TC-STOCK-1-11: The catalog shows an unchecked "In stock only" checkbox with the filters

## Why

- The Inputs fix the default (unchecked) and the Outputs fix the exact label and its place among the filters. A checked default would hide products from every shopper. E2E because the label and default are only observable in the rendered page.

## Preconditions

- Test stack scenario `stock-1` (new, `extends: default`): item 1 "Wanderer Black Hiking Boots" (brand 1 Daybird) and item 2 "Summit Pro Harness" (brand 2 Gravitator) have `AvailableStock` 0; items 3 to 101 keep `AvailableStock` 100. The catalog page shows 9 products per page, ordered by name.
- Anonymous visitor.

## Steps

1. Open `/`.

## Expected result

- The catalog filter area (the same component that holds the brand and type filters) contains a checkbox whose accessible label is exactly `In stock only`.
- The checkbox is not checked.
- The page URL has no `onlyAvailable` query parameter.
- The pager's highest page number is 12 (101 products, 9 per page).
