---
id: TC-STOCK-1-21
type: happy
layer: e2e
covers: ["AC7: on a product with stock the button works as today"]
priority: P1
---

# TC-STOCK-1-21: On an in-stock product page there is no label and "Add to shopping bag" adds it

## Why

- AC7's regression guard: the disabled state must apply only to out-of-stock products. Item 3 has stock 100; adding it must work exactly as before.

## Preconditions

- Test stack scenario `stock-1` (new, `extends: default`): item 1 "Wanderer Black Hiking Boots" (brand 1 Daybird) and item 2 "Summit Pro Harness" (brand 2 Gravitator) have `AvailableStock` 0; items 3 to 101 keep `AvailableStock` 100. The catalog page shows 9 products per page, ordered by name.
- Signed in as `alice` (password `Pass123$`); alice's basket is empty.

## Steps

1. Open `/item/3`.
2. Click `Add to shopping bag`.

## Expected result

- Before the click, the page heading is `Alpine Fusion Goggles`, no element with the text `Out of stock` is shown, and the button has no `disabled` attribute.
- After the click, the header cart link's `.cart-button-count` element reads `1`.
