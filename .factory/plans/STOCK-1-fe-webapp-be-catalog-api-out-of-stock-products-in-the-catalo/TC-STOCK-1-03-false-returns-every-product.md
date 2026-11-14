---
id: TC-STOCK-1-03
type: happy
layer: functional
covers: ["AC2", "Inputs: onlyAvailable false returns every product"]
priority: P2
---

# TC-STOCK-1-03: onlyAvailable=false returns every product, including out-of-stock ones

## Why

- AC2 and the Inputs table say `false` behaves as today. The v2 handler parses the text itself, so an explicit `false` must parse and must not filter; a bug that treats "present" as "true" would only show here.

## Preconditions

- Functional fixture (`CatalogApiFixture`): the catalog database holds exactly the 101 seeded demo items. Item 1 "Wanderer Black Hiking Boots" (brand 1 Daybird, type 1 Footwear) and item 2 "Summit Pro Harness" (brand 2 Gravitator, type 2 Climbing) have `AvailableStock` 0; items 3 to 101 have `AvailableStock` 100.

## Steps

1. Anonymous `GET /api/catalog/items?api-version=2.0&onlyAvailable=false&pageIndex=0&pageSize=101`.

## Expected result

- Status 200.
- `count` is 101.
- `data` has 101 items and contains the items with `id` 1 and `id` 2.
