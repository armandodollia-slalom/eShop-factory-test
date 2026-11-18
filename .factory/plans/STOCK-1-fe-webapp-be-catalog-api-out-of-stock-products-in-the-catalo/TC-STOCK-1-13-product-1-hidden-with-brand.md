---
id: TC-STOCK-1-13
type: happy
layer: e2e
covers: ["AC5: product 1 no longer listed", "Inputs: kept in URL with the existing brand parameter"]
priority: P1
---

# TC-STOCK-1-13: With brand Daybird selected, checking "In stock only" hides product 1 and keeps the brand

## Why

- AC5 says product 1 is no longer listed, and the Inputs say the checkbox lives in the URL together with the brand parameter. Daybird has 10 products (2 pages); product 1 is the 10th by name, so after filtering the 9 remaining fit on one page and the absence of product 1 is visible without paging through 11 pages.

## Preconditions

- Test stack scenario `stock-1` (new, `extends: default`): item 1 "Wanderer Black Hiking Boots" (brand 1 Daybird) and item 2 "Summit Pro Harness" (brand 2 Gravitator) have `AvailableStock` 0; items 3 to 101 keep `AvailableStock` 100. The catalog page shows 9 products per page, ordered by name.
- Anonymous visitor.

## Steps

1. Open `/?brand=1`.
2. Check the `In stock only` checkbox.

## Expected result

- The URL query contains both `brand=1` and `onlyAvailable=true`.
- Exactly 9 product cards are listed; none is titled `Wanderer Black Hiking Boots`.
- The pager shows no page 2 link.
