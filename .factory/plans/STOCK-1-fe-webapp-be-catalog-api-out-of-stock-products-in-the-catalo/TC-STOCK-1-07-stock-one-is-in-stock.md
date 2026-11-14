---
id: TC-STOCK-1-07
type: sad
sad-path: boundary
layer: functional
covers: ["Inputs: availableStock greater than 0", "Open question 1: out of stock is availableStock <= 0"]
priority: P2
---

# TC-STOCK-1-07: A product with availableStock 1 is returned by onlyAvailable=true

## Why

- Boundary just inside the limit: the rule is `availableStock > 0`, so stock 1 must count as available. An off-by-one (`>= 1` is fine, `> 1` is not) would hide the last unit of a product. The brand filter isolates the item so the result does not depend on other cases' data.

## Preconditions

- Functional fixture (`CatalogApiFixture`): the catalog database holds exactly the 101 seeded demo items. Item 1 "Wanderer Black Hiking Boots" (brand 1 Daybird, type 1 Footwear) and item 2 "Summit Pro Harness" (brand 2 Gravitator, type 2 Climbing) have `AvailableStock` 0; items 3 to 101 have `AvailableStock` 100.
- The case runs in the same xUnit test collection as TC-01 to TC-10, so no other STOCK-1 case runs while item 3 is changed.

## Steps

1. Set item 3 "Alpine Fusion Goggles" (brand 3 WildRunner) to `AvailableStock` 1 in the fixture database.
2. Anonymous `GET /api/catalog/items?api-version=2.0&onlyAvailable=true&brand=3&pageIndex=0&pageSize=20`.
3. Restore item 3 to `AvailableStock` 100 in a `finally` block, so it runs even when an assertion of step 2 fails.

## Expected result

- Status 200.
- `count` is 11 (all WildRunner items).
- `data` contains the item with `id` 3 and `availableStock` 1.
- After step 3, item 3 has `AvailableStock` 100 again, so TC-01 and TC-06 still see 99 in-stock products whatever order the cases run in.
