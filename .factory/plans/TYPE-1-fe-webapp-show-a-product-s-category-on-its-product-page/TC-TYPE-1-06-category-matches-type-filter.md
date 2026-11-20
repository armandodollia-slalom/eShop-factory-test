---
id: TC-TYPE-1-06
type: happy
layer: e2e
covers: ["AC2: Category is the name of the product's catalog type, the same name the catalog's type filter shows for it"]
priority: P1
---

# TC-TYPE-1-06: Category on the product page is the name the type filter shows for the product

## Why

- AC2 ties the page to the catalog's type filter as the shopper sees it. Walking from the filter to the product proves the label the shopper filtered by is the one the product page shows, for a type other than item 1's. e2e is required because the comparison is between two rendered pages.

## Preconditions

- Test stack with scenario `default`; item 99 "Adventurer GPS Watch" has type 7 "Navigation"; 11 seeded items have type 7.
- Not signed in.

## Steps

1. Open the catalog root `/`.
2. In the "Type" filter, click the tag whose label is "Navigation" (URL becomes `/?type=7`).
3. In the filtered list, click "Adventurer GPS Watch".

## Expected result

- After step 2, the URL contains `type=7`, the "Navigation" tag in the Type filter has class `active`, and the list shows 9 product cards whose names are all among the 11 seeded Navigation items: "Adventurer GPS Watch", "Astro GPS Navigator", "Compass Pro A-320 Professional Compass", "Expedition 200 GPS Navigator", "Explorer Biking Computer", "Pathfinder GPS Watch", "Pathfinder Portable GPS", "Pulse Recon Tactical GPS Watch", "TrailSeeker GPS Watch", "TrailTracker GPS Watch", "VenturePro GPS Watch". "Adventurer GPS Watch" is one of the 9 cards (the list is ordered by name).
- After step 3, the page is `/item/99`, and in `dl.item-meta` the `dd` after `dt` "Category" reads "Navigation", exactly the label of the type tag clicked in step 2.
