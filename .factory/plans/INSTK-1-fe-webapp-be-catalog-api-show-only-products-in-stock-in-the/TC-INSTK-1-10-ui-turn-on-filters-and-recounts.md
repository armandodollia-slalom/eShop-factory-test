---
id: TC-INSTK-1-10
type: happy
layer: e2e
covers: ["AC2: lists only products with at least one unit in stock", "AC2: product count and pages count only those", "AC2: the address bar keeps the choice"]
priority: P1
---

# TC-INSTK-1-10: Turning "In stock only" on lists only in-stock products and recounts products and pages

## Why

- AC2 is the core shopper journey: one click must change the list, the product count and the number of pages, and record the choice in the URL. Checking the counts in the browser proves the WebApp passes the filter to the API (a WebApp that forgot it would still show 101).

## Preconditions

- Test stack running scenario `instk-1`.
- Anonymous shopper on `/`.

## Steps

1. Click "In stock only" in the filter panel.

## Expected result

- The address bar contains `inStock=true`.
- The toolbar reads "90 products".
- The pager's last page number is 10 (90 products at 9 per page).
- "In stock only" shows its active state, and the filter panel's active-filter count reads 1.
- On each of pages 1 to 10, no product card shows the name of an out-of-stock item: Raven Swift Snowboard, Blizzard Snowboard, Trailblaze hiking backpack, Blizzard Rider Snowboard, Cosmic Purple Snowboard, Gravity Beam Climbing Rope, Expedition Backpack, Frostbite Insulated Jacket, VenturePro GPS Watch, Trailblazer Bike Helmet, EcoTrail Running Shoes.
