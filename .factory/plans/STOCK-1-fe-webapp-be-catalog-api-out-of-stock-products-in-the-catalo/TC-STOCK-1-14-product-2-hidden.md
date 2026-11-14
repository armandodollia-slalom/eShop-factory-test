---
id: TC-STOCK-1-14
type: happy
layer: e2e
covers: ["AC5: product 2 no longer listed"]
priority: P2
---

# TC-STOCK-1-14: With the filter on, product 2 is not listed among Gravitator products

## Why

- AC5 names products 1 and 2. Gravitator has 11 products; unfiltered, page 2 shows "Summit Pro Harness" (item 2) and "Zero Gravity Ski Goggles". With the filter on, page 2 must show only "Zero Gravity Ski Goggles", proving item 2 is filtered and the pager counts 10 products.

## Preconditions

- Test stack scenario `stock-1` (new, `extends: default`): item 1 "Wanderer Black Hiking Boots" (brand 1 Daybird) and item 2 "Summit Pro Harness" (brand 2 Gravitator) have `AvailableStock` 0; items 3 to 101 keep `AvailableStock` 100. The catalog page shows 9 products per page, ordered by name.
- Anonymous visitor.

## Steps

1. Open `/?brand=2&onlyAvailable=true&page=2`.

## Expected result

- Exactly 1 product card is listed, titled `Zero Gravity Ski Goggles`.
- No card is titled `Summit Pro Harness`.
- The `In stock only` checkbox is checked.
