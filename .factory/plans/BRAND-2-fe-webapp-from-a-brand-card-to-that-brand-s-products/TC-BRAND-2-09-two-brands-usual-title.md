---
id: TC-BRAND-2-09
type: happy
layer: e2e
covers: ["AC3: more than one brand selected shows the usual title and no \"All brands\" link", "Implementation Notes: two brand query values"]
priority: P1
---

# TC-BRAND-2-09: Catalog filtered to two brands shows the usual title and no "All brands" link

## Why

- AC3 is the boundary of AC2: one brand gets the brand title, two do not. Naming only the first brand, or "Brand: Daybird, Gravitator", would mislabel the page. The Implementation Notes ask for two `brand` query values. e2e because the header is rendered from the catalog URL on the test stack.

## Preconditions

- Test stack running with scenario `default`. Brand 1 "Daybird" (10 items) and brand 2 "Gravitator" (11 items). Anonymous visitor.

## Steps

1. Open `/?brand=1&brand=2` and wait until the catalog toolbar reads "21 products".

## Expected result

- The page header title text is exactly "Ready for a new adventure?".
- The page header subtitle text is exactly "Start the season with the latest in clothing and equipment.".
- The page has no link with text "All brands".
- The page does not contain the text "Brand: Daybird" nor "Brand: Gravitator".
- In the Brand group, both the "Daybird" and the "Gravitator" tags have class `active`.
