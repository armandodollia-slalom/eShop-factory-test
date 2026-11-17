---
id: TC-BUG-43-01
type: happy
layer: functional
covers: ["Steps to Reproduce: step 1", "Expected: step 1 result is the reference (4 items, count 4)"]
priority: P1
---

# TC-BUG-43-01: v2 search with name=Explorer (matching case) returns the four Explorer items

## Why

- Step 1 is the reference the other steps are compared with, and the fix must not break the search that worked before. Functional layer: the endpoint, EF query and real Postgres are exercised in-process, which is where the name comparison happens; no UI is involved.

## Preconditions

- Catalog functional host (`tests/Catalog.FunctionalTests`, `CatalogApiFixture`) seeded with the demo catalog (`src/Catalog.API/Setup/catalog.json`, the same 101 items as the test stack `default` scenario).
- Exactly four items have a name starting with "Explorer": "Explorer 45L Backpack" (Bags, Solstix), "Explorer Biking Computer" (Navigation, B&R), "Explorer Camping Tent" (Trekking, B&R), "Explorer Frost Boots" (Footwear, Daybird). No other item name starts with "explorer" in any letter case.

## Steps

1. Anonymous `GET /api/catalog/items?api-version=2.0&name=Explorer` (default paging: PageSize 10, PageIndex 0).

## Expected result

- Status 200.
- Body `count` is 4, `pageIndex` 0, `pageSize` 10.
- `data` holds exactly 4 items, in this order (sorted by name):
  1. "Explorer 45L Backpack"
  2. "Explorer Biking Computer"
  3. "Explorer Camping Tent"
  4. "Explorer Frost Boots"
