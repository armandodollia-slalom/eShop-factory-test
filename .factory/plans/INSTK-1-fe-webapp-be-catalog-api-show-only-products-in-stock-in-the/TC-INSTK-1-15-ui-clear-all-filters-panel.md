---
id: TC-INSTK-1-15
type: happy
layer: e2e
covers: ["AC4: 'Clear all filters' turns 'In stock only' off with the other filters"]
priority: P1
---

# TC-INSTK-1-15: "Clear all filters" in the filter panel turns "In stock only" off

## Why

- AC4: the reset link must drop `inStock` together with brand and type; a reset that kept it would leave the shopper with a hidden filter and 90 products instead of 101.

## Preconditions

- Test stack running scenario `instk-1`.
- Anonymous shopper on `/?brand=1&type=3&inStock=true` ("2 products").

## Steps

1. Click "Clear all filters" in the filter panel.

## Expected result

- The address bar has none of `brand`, `type`, `inStock`.
- The toolbar reads "101 products" and the pager's last page number is 12.
- "In stock only", "Daybird" and "Ski/boarding" no longer show their active state; the active-filter count and the "Clear all filters" link are gone.
