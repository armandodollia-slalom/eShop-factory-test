---
id: TC-STOCK-1-19
type: happy
layer: e2e
covers: ["AC7: product page shows Out of stock", "Outputs: label on the product page"]
priority: P1
---

# TC-STOCK-1-19: The product page of product 1 shows "Out of stock"

## Why

- AC7 and the Outputs require the label on the product page too, where the shopper decides to buy. E2E because it is rendered markup on the test stack.

## Preconditions

- Test stack scenario `stock-1` (new, `extends: default`): item 1 "Wanderer Black Hiking Boots" (brand 1 Daybird) and item 2 "Summit Pro Harness" (brand 2 Gravitator) have `AvailableStock` 0; items 3 to 101 keep `AvailableStock` 100. The catalog page shows 9 products per page, ordered by name.
- Signed in as `alice` (password `Pass123$`).

## Steps

1. Open `/item/1`.

## Expected result

- The page heading is `Wanderer Black Hiking Boots`.
- The page shows a visible element with exactly the text `Out of stock`.
