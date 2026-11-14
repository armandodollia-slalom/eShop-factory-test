---
id: TC-STOCK-1-10
type: happy
layer: functional
covers: ["Outputs: API version 1.0 is unchanged"]
priority: P2
---

# TC-STOCK-1-10: API version 1.0 ignores onlyAvailable and returns every product

## Why

- The Outputs require v1.0 to stay unchanged. The parameter is defined on v2 only, so a v1 caller sending it must get today's full result, not a filtered one and not a 400. Sending `onlyAvailable=true` is the sharpest check: a leak of the v2 behavior into v1 would drop items 1 and 2.

## Preconditions

- Functional fixture (`CatalogApiFixture`): the catalog database holds exactly the 101 seeded demo items. Item 1 "Wanderer Black Hiking Boots" (brand 1 Daybird, type 1 Footwear) and item 2 "Summit Pro Harness" (brand 2 Gravitator, type 2 Climbing) have `AvailableStock` 0; items 3 to 101 have `AvailableStock` 100.

## Steps

1. Anonymous `GET /api/catalog/items?api-version=1.0&onlyAvailable=true&pageIndex=0&pageSize=101`.

## Expected result

- Status 200.
- `count` is 101.
- `data` contains the items with `id` 1 and `id` 2.
