---
id: TC-STOCK-1-02
type: happy
layer: functional
covers: ["AC2", "Inputs: onlyAvailable absent returns every product"]
priority: P1
---

# TC-STOCK-1-02: Without onlyAvailable every product is returned, including out-of-stock ones

## Why

- AC2 protects existing clients: the new filter must be opt-in, so omitting it must keep today's result. Separate from the `false` case because "absent" and "false" travel different binding paths (null versus a parsed value).

## Preconditions

- Functional fixture (`CatalogApiFixture`): the catalog database holds exactly the 101 seeded demo items. Item 1 "Wanderer Black Hiking Boots" (brand 1 Daybird, type 1 Footwear) and item 2 "Summit Pro Harness" (brand 2 Gravitator, type 2 Climbing) have `AvailableStock` 0; items 3 to 101 have `AvailableStock` 100.

## Steps

1. Anonymous `GET /api/catalog/items?api-version=2.0&pageIndex=0&pageSize=101`.

## Expected result

- Status 200.
- `count` is 101.
- `data` has 101 items and contains the items with `id` 1 and `id` 2, each with `availableStock` 0.
