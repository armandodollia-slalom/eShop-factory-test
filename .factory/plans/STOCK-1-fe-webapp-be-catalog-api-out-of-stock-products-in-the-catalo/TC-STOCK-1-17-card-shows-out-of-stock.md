---
id: TC-STOCK-1-17
type: happy
layer: e2e
covers: ["AC6: out-of-stock card shows Out of stock", "Outputs: label with exactly the text Out of stock on the catalog card"]
priority: P1
---

# TC-STOCK-1-17: The catalog card of product 1 shows "Out of stock"

## Why

- AC6: a shopper browsing with the filter off must see which products are unavailable. Product 1 is the 10th Daybird product by name, so it is on page 2 of `/?brand=1`.

## Preconditions

- Test stack scenario `stock-1` (new, `extends: default`): item 1 "Wanderer Black Hiking Boots" (brand 1 Daybird) and item 2 "Summit Pro Harness" (brand 2 Gravitator) have `AvailableStock` 0; items 3 to 101 keep `AvailableStock` 100. The catalog page shows 9 products per page, ordered by name.
- Anonymous visitor.

## Steps

1. Open `/?brand=1&page=2`.

## Expected result

- The `In stock only` checkbox is not checked.
- Exactly 1 product card is listed, titled `Wanderer Black Hiking Boots`.
- That card contains a visible element with exactly the text `Out of stock`.
