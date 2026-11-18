---
id: TC-RANGE-1-14
type: happy
layer: e2e
covers: ["AC4: no products, no price range"]
priority: P1
---

# TC-RANGE-1-14: A selection with no products shows no price range

## Why

- AC4 forbids showing a range for an empty selection (a "Price $0.00" or empty "Prices" label would mislead). The page shows its empty state here, so the case checks no range text leaks into it.

## Preconditions

- Test stack up with the `default` scenario; anonymous visitor. Daybird (brand 1) has no Navigation (type 7) product.

## Steps

1. Open `/?brand=1&type=7`.

## Expected result

- The heading "No products match these filters" is visible.
- The page has no `.catalog-price-range` element.
- The page's main content contains neither the text "Price $" nor "Prices $".
