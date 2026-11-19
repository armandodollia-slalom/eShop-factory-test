---
id: TC-INSTK-1-18
type: happy
layer: e2e
covers: ["AC3: 'In stock only' with a brand, paging keeps every one of them", "AC2: product and pages count only in-stock products"]
priority: P1
---

# TC-INSTK-1-18: Paging keeps the brand and "In stock only" filters

## Why

- AC3 says paging keeps every filter, brand included; TC-INSTK-1-13 only pages with a type. A pager link that dropped `brand` or `inStock` would show other brands or the out-of-stock item on page 2. No brand in the INSTK-1 stock set has more than 9 in-stock products, so this case uses its own scenario in which WildRunner (brand 3) has 11 products, 1 out of stock: 10 in stock is exactly two pages, and the out-of-stock item sits on page 1 by name, so page 2 differs with and without the filter.

## Preconditions

- Test stack running scenario `instk-1-brand-paging` (see `_index.md`): scenario `instk-1` plus item 70 GripTrek Hiking Poles (WildRunner, Trekking) at `AvailableStock` 0.
- WildRunner's 10 in-stock products by name: Alpine Fusion Goggles (3), Maverick Pro Ski Goggles (82), Omni-Snow Dual Snowboard (73), Ridgevent Stealth Hiking Backpack (24), SummitRider Snowboard Boots (60), Trailblaze Steel-Blue Hiking Shoes (61), Trailblazer Trail Running Shoes (91), Trekker Clear Hiking Shoes (41), Venture Grey Trail Shoes (33) on page 1; Vertical Journey Climbing Shoes (11) on page 2.
- Anonymous shopper on `/` with the default sort "Name: A to Z".

## Steps

1. Click the "WildRunner" brand tag.
2. Click "In stock only".
3. In the pager, click page number 2.

## Expected result

- After step 2: the toolbar reads "10 products"; the pager's last page number is 2; "GripTrek Hiking Poles" is not shown.
- After step 3: the address bar contains `brand=3`, `inStock=true` and `page=2`.
- After step 3: the toolbar still reads "10 products"; the pager shows 2 pages with page 2 current.
- After step 3: the page shows exactly 1 card, "Vertical Journey Climbing Shoes"; "Venture Grey Trail Shoes", "GripTrek Hiking Poles" and every product of another brand are not shown.
- After step 3: "WildRunner" and "In stock only" still show their active state, and the active-filter count reads 2.
