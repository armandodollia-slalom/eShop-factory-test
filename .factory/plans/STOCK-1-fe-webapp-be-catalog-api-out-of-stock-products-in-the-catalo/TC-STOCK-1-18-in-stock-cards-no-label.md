---
id: TC-STOCK-1-18
type: happy
layer: e2e
covers: ["AC6: cards of products with stock show no such label"]
priority: P2
---

# TC-STOCK-1-18: Cards of in-stock products show no "Out of stock" label

## Why

- AC6's negative half: the label must be conditional. A label rendered on every card would make the feature useless. Page 1 of `/?brand=1` holds 9 Daybird products, all in stock.

## Preconditions

- Test stack scenario `stock-1` (new, `extends: default`): item 1 "Wanderer Black Hiking Boots" (brand 1 Daybird) and item 2 "Summit Pro Harness" (brand 2 Gravitator) have `AvailableStock` 0; items 3 to 101 keep `AvailableStock` 100. The catalog page shows 9 products per page, ordered by name.
- Anonymous visitor.

## Steps

1. Open `/?brand=1`.

## Expected result

- Exactly 9 product cards are listed.
- No card contains the text `Out of stock`.
