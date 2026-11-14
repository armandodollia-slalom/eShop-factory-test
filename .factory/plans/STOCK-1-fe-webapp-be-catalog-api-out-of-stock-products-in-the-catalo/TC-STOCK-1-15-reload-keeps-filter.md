---
id: TC-STOCK-1-15
type: happy
layer: e2e
covers: ["AC5: reloading keeps the filter checked", "Inputs: kept in the page URL"]
priority: P1
---

# TC-STOCK-1-15: Reloading the catalog keeps "In stock only" checked and filtered

## Why

- AC5 requires the filter to survive a reload, which only works if the state lives in the URL and the page reads it back. Separate from TC-STOCK-1-12 because it checks the read path (URL → checkbox), not the write path.

## Preconditions

- Test stack scenario `stock-1` (new, `extends: default`): item 1 "Wanderer Black Hiking Boots" (brand 1 Daybird) and item 2 "Summit Pro Harness" (brand 2 Gravitator) have `AvailableStock` 0; items 3 to 101 keep `AvailableStock` 100. The catalog page shows 9 products per page, ordered by name.
- Anonymous visitor.

## Steps

1. Open `/?brand=1`.
2. Check the `In stock only` checkbox.
3. Reload the page.

## Expected result

- The URL query still contains `brand=1` and `onlyAvailable=true`.
- The `In stock only` checkbox is checked.
- Exactly 9 product cards are listed; none is titled `Wanderer Black Hiking Boots`.
