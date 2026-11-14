---
id: TC-STOCK-1-04
type: happy
layer: functional
covers: ["AC3", "Outputs: combined with brand filter, all filters apply"]
priority: P1
---

# TC-STOCK-1-04: onlyAvailable=true combined with a brand returns only in-stock products of that brand

## Why

- AC3: the stock filter must be ANDed with the brand filter, not replace it. Brand 1 Daybird has 10 products, one of which (item 1) is out of stock, so both filters are visible in one response.

## Preconditions

- Functional fixture (`CatalogApiFixture`): the catalog database holds exactly the 101 seeded demo items. Item 1 "Wanderer Black Hiking Boots" (brand 1 Daybird, type 1 Footwear) and item 2 "Summit Pro Harness" (brand 2 Gravitator, type 2 Climbing) have `AvailableStock` 0; items 3 to 101 have `AvailableStock` 100.
- Brand 1 Daybird has 10 items: 1, 13, 25, 39, 49, 53, 62, 71, 85, 92.

## Steps

1. Anonymous `GET /api/catalog/items?api-version=2.0&onlyAvailable=true&brand=1&pageIndex=0&pageSize=20`.

## Expected result

- Status 200.
- `count` is 9.
- The ids in `data` are exactly 13, 25, 39, 49, 53, 62, 71, 85, 92 (item 1 is absent).
- Every item in `data` has `catalogBrandId` 1.
