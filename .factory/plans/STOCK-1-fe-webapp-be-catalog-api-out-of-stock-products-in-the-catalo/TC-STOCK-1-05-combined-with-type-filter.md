---
id: TC-STOCK-1-05
type: happy
layer: functional
covers: ["Outputs: combined with type filter, all filters apply"]
priority: P2
---

# TC-STOCK-1-05: onlyAvailable=true combined with a type returns only in-stock products of that type

## Why

- The Outputs section says the stock filter combines with both the brand and the type filters; AC3 only names brand, so the type combination needs its own case. Type 1 Footwear has 13 products, one of which (item 1) is out of stock.

## Preconditions

- Functional fixture (`CatalogApiFixture`): the catalog database holds exactly the 101 seeded demo items. Item 1 "Wanderer Black Hiking Boots" (brand 1 Daybird, type 1 Footwear) and item 2 "Summit Pro Harness" (brand 2 Gravitator, type 2 Climbing) have `AvailableStock` 0; items 3 to 101 have `AvailableStock` 100.
- Type 1 Footwear has 13 items: 1, 19, 21, 33, 40, 41, 57, 61, 71, 75, 81, 91, 101.

## Steps

1. Anonymous `GET /api/catalog/items?api-version=2.0&onlyAvailable=true&type=1&pageIndex=0&pageSize=20`.

## Expected result

- Status 200.
- `count` is 12.
- The ids in `data` are exactly 19, 21, 33, 40, 41, 57, 61, 71, 75, 81, 91, 101 (item 1 is absent).
- Every item in `data` has `catalogTypeId` 1.
