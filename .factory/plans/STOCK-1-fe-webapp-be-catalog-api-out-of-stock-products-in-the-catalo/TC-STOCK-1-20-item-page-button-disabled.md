---
id: TC-STOCK-1-20
type: sad
sad-path: conflict
layer: e2e
covers: ["AC7: Add to shopping bag disabled for an out-of-stock product", "Outputs: button disabled"]
priority: P1
---

# TC-STOCK-1-20: "Add to shopping bag" is disabled for product 1 and the bag stays empty

## Why

- AC7 and the user story's goal ("cannot add one to my bag by mistake"): adding an unavailable product is a state conflict the UI must prevent. Signed in because the button only renders for signed-in shoppers; the bag count proves nothing was added.

## Preconditions

- Test stack scenario `stock-1` (new, `extends: default`): item 1 "Wanderer Black Hiking Boots" (brand 1 Daybird) and item 2 "Summit Pro Harness" (brand 2 Gravitator) have `AvailableStock` 0; items 3 to 101 keep `AvailableStock` 100. The catalog page shows 9 products per page, ordered by name.
- Signed in as `alice` (password `Pass123$`); alice's basket is empty.

## Steps

1. Open `/item/1`.
2. Attempt to click `Add to shopping bag` (with Playwright `force: true`).

## Expected result

- The `Add to shopping bag` button has the `disabled` attribute.
- After the click attempt, the header cart link has no `.cart-button-count` element.
