---
id: TC-STOCK-1-01
type: happy
layer: functional
covers: ["AC1", "Inputs: onlyAvailable true", "Outputs: only products with availableStock > 0, count"]
priority: P1
---

# TC-STOCK-1-01: onlyAvailable=true returns only in-stock products and counts them

## Why

- AC1 is the core of the API change: products with `availableStock` 0 must disappear and `count` must count only in-stock products, otherwise the WebApp pager is wrong. Functional layer because the filter is an EF query against real Postgres, which a unit test with mocks cannot prove.

## Preconditions

- Functional fixture (`CatalogApiFixture`): the catalog database holds exactly the 101 seeded demo items. Item 1 "Wanderer Black Hiking Boots" (brand 1 Daybird, type 1 Footwear) and item 2 "Summit Pro Harness" (brand 2 Gravitator, type 2 Climbing) have `AvailableStock` 0; items 3 to 101 have `AvailableStock` 100.

## Steps

1. Anonymous `GET /api/catalog/items?api-version=2.0&onlyAvailable=true&pageIndex=0&pageSize=101`.

## Expected result

- Status 200.
- `count` is 99.
- `data` has 99 items; no item has `id` 1 or `id` 2.
- Every item in `data` has `availableStock` greater than 0.
