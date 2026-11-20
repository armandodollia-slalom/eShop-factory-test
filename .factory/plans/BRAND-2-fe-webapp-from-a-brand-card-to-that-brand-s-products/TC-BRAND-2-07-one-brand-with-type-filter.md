---
id: TC-BRAND-2-07
type: happy
layer: e2e
covers: ["AC2: exactly one brand selected, together with a type filter"]
priority: P3
---

# TC-BRAND-2-07: One brand plus a type filter still names the brand in the header

## Why

- AC2 and AC3 depend only on how many brands are selected. A check written as "the query has exactly one filter value" would drop the brand title as soon as the shopper also picks a type. e2e because the combination is a catalog URL rendered by the WebApp.

## Preconditions

- Test stack running with scenario `default`. Brand 1 "Daybird" has at least one item of type 1 (item 1 "Wanderer Black Hiking Boots"). Anonymous visitor.

## Steps

1. Open `/?brand=1&type=1`.

## Expected result

- The catalog toolbar shows a product count of at least 1 ("1 product" or "N products").
- The page header title text is exactly "Brand: Daybird".
- The page header subtitle contains the link "All brands" with `href` `/brands`.
