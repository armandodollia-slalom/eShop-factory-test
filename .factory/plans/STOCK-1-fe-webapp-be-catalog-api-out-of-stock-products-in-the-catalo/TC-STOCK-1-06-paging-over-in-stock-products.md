---
id: TC-STOCK-1-06
type: happy
layer: functional
covers: ["Outputs: paging works over in-stock products"]
priority: P1
---

# TC-STOCK-1-06: Paging with onlyAvailable=true pages over in-stock products only

## Why

- The Outputs require paging to work over the filtered set. If the filter were applied after Skip/Take, the last page would be short or contain out-of-stock items. 99 in-stock items with page size 10 give a last page (index 9) of exactly 9 items, which only holds when the filter runs before paging.

## Preconditions

- Functional fixture (`CatalogApiFixture`): the catalog database holds exactly the 101 seeded demo items. Item 1 "Wanderer Black Hiking Boots" (brand 1 Daybird, type 1 Footwear) and item 2 "Summit Pro Harness" (brand 2 Gravitator, type 2 Climbing) have `AvailableStock` 0; items 3 to 101 have `AvailableStock` 100.

## Steps

1. Anonymous `GET /api/catalog/items?api-version=2.0&onlyAvailable=true&pageIndex=9&pageSize=10`.

## Expected result

- Status 200.
- `pageIndex` is 9, `pageSize` is 10, `count` is 99.
- `data` has exactly 9 items; none has `id` 1 or `id` 2.
