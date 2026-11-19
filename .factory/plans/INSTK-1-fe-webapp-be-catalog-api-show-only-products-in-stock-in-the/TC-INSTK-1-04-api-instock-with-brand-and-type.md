---
id: TC-INSTK-1-04
type: happy
layer: functional
covers: ["AC3: in stock, brand and type apply at once"]
priority: P1
---

# TC-INSTK-1-04: inStock=true combines with brand and type filters

## Why

- AC3 requires all filters to apply together; a filter that replaced the brand or type condition instead of adding to it would return the wrong set. Daybird + Ski/boarding has 4 items, 2 of them out of stock, so each filter visibly removes items.

## Preconditions

- Catalog functional fixture with the INSTK-1 stock set: Daybird (brand 1) Ski/boarding (type 3) items 39 and 62 at 100, items 53 and 92 at 0.

## Steps

1. Anonymous `GET /api/catalog/items?api-version=2.0&inStock=true&brand=1&type=3&PageSize=10&PageIndex=0`.

## Expected result

- Status 200.
- `count` is 2; `data` ids are exactly {39, 62} (Midnight Blue Goggles, Shadow Black Snowboard).
- Every item in `data` has `catalogBrandId` 1 and `catalogTypeId` 3.
