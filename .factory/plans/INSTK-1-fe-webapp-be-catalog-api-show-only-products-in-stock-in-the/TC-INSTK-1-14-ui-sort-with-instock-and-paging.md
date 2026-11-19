---
id: TC-INSTK-1-14
type: happy
layer: e2e
covers: ["AC3: 'In stock only' with a sort order, all apply at once", "AC3: paging keeps the sort order"]
priority: P2
---

# TC-INSTK-1-14: Sort order applies together with "In stock only" and survives paging

## Why

- AC3 names the sort order explicitly. The sort runs in the browser (`catalog-sort.js`) on the cards the filtered page renders, so only e2e shows that the two work together and that the chosen sort is still applied after moving to page 2.

## Preconditions

- Test stack running scenario `instk-1`.
- Anonymous shopper on `/?type=3&inStock=true` with the default sort "Name: A to Z".

## Steps

1. Open the "Sort" control and choose "Price: High to Low".
2. In the pager, click page number 2.

## Expected result

- After step 1: the toolbar reads "14 products"; the 9 cards appear in this order: GravityZone All-Mountain Skis and Gravity 5000 All-Mountain Skis (both 699.00, either order), Glacier Frost Snowboard (419.99), Blizzard Freestyle Snowboard (379.00), Omni-Snow Dual Snowboard (289.99), Maverick Pro Ski Goggles (139.99), Midnight Blue Goggles (89.99), Expedition 2022 Goggles (89.00), Alpine Fusion Goggles (79.99). Cosmic Purple Snowboard (419.99, out of stock) is not shown.
- After step 2: the address bar contains `type=3`, `inStock=true` and `page=2`; the "Sort" control still reads "Price: High to Low"; the 5 cards appear in this order: Venture 2022 Snowboard (499.00), Powder Pro Snowboard (399.00), Shadow Black Snowboard (379.00), SummitRider Snowboard Boots (249.00), Zero Gravity Ski Goggles (79.99).
