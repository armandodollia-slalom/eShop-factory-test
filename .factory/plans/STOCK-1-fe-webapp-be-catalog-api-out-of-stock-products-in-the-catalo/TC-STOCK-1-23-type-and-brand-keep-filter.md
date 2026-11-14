---
id: TC-STOCK-1-23
type: happy
layer: e2e
covers: ["Inputs: In stock only kept in the page URL with the brand and type parameters", "Outputs: combined with brand and type filters, all filters apply"]
priority: P1
---

# TC-STOCK-1-23: With "In stock only" checked, picking a type and then a brand keeps the filter and applies all three

## Why

- The Inputs say the checkbox state is kept in the URL together with the brand and type parameters. TC-13 only checks the box after a brand was already chosen; this case checks the opposite direction, that the brand and type links of the filter panel keep `onlyAvailable=true`. Footwear + Daybird holds exactly two products, "Explorer Frost Boots" (item 71, in stock) and "Wanderer Black Hiking Boots" (item 1, out of stock), so a single remaining card proves all three filters apply. E2E because the links are built by the page.

## Preconditions

- Test stack scenario `stock-1` (new, `extends: default`): item 1 "Wanderer Black Hiking Boots" (brand 1 Daybird, type 1 Footwear) and item 2 "Summit Pro Harness" (brand 2 Gravitator) have `AvailableStock` 0; items 3 to 101 keep `AvailableStock` 100. The catalog page shows 9 products per page, ordered by name.
- Anonymous visitor.

## Steps

1. Open `/`.
2. Check the `In stock only` checkbox and wait for the page to reload with `onlyAvailable=true` in the URL.
3. In the filter panel's `Type` group, click the `Footwear` tag.
4. In the filter panel's `Brand` group, click the `Daybird` tag.

## Expected result

- After step 3: the URL query contains both `onlyAvailable=true` and `type=1`, and the `In stock only` checkbox is checked.
- After step 4: the URL query contains `onlyAvailable=true`, `type=1` and `brand=1`.
- After step 4: the `In stock only` checkbox is checked.
- After step 4: exactly 1 product card is listed, titled `Explorer Frost Boots`; no card is titled `Wanderer Black Hiking Boots`.
