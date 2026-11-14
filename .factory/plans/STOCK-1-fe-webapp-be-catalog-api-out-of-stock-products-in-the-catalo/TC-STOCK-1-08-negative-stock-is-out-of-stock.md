---
id: TC-STOCK-1-08
type: sad
sad-path: boundary
layer: functional
covers: ["Open question 1: out of stock is availableStock 0 or less"]
priority: P3
---

# TC-STOCK-1-08: A product with negative availableStock is excluded by onlyAvailable=true

## Why

- The story's answer to Open Question 1 defines out of stock as `availableStock` 0 or less. Negative stock can occur after oversell; such a product must not be offered as available. Isolated by brand 4 Quester (4 items).

## Preconditions

- Functional fixture (`CatalogApiFixture`): the catalog database holds exactly the 101 seeded demo items. Item 1 "Wanderer Black Hiking Boots" (brand 1 Daybird, type 1 Footwear) and item 2 "Summit Pro Harness" (brand 2 Gravitator, type 2 Climbing) have `AvailableStock` 0; items 3 to 101 have `AvailableStock` 100.
- The other three Quester items have `AvailableStock` 100.
- The case runs in the same xUnit test collection as TC-01 to TC-10, so no other STOCK-1 case runs while item 4 is changed.

## Steps

1. Set item 4 "Expedition Backpack" (brand 4 Quester) to `AvailableStock` -1 in the fixture database.
2. Anonymous `GET /api/catalog/items?api-version=2.0&onlyAvailable=true&brand=4&pageIndex=0&pageSize=20`.
3. Restore item 4 to `AvailableStock` 100 in a `finally` block, so it runs even when an assertion of step 2 fails.

## Expected result

- Status 200.
- `count` is 3.
- `data` has 3 items; none has `id` 4.
- After step 3, item 4 has `AvailableStock` 100 again, so TC-01 and TC-06 still see 99 in-stock products whatever order the cases run in.
