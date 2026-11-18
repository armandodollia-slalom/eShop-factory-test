---
id: TC-RANGE-1-13
type: happy
layer: e2e
covers: ["AC3: same lowest and highest price shows Price $X"]
priority: P1
---

# TC-RANGE-1-13: A selection whose products share one price shows "Price $79.99"

## Why

- AC3 replaces the range with a single price (singular "Price") when both bounds are equal. A selection of two products at the same price is used so the case tests equal bounds, not a one-product special case.

## Preconditions

- Test stack up with the `default` scenario; anonymous visitor. Raptor Elite (brand 6) Cycling (type 8): items 58 "VelociX 2000 Bike Helmet" and 86 "ProVent Bike Helmet", both $79.99.

## Steps

1. Open `/?brand=6&type=8`.

## Expected result

- `.catalog-count` contains "2 products".
- `.catalog-price-range` has exactly the text "Price $79.99".
- The range text contains neither "Prices" nor "–".
