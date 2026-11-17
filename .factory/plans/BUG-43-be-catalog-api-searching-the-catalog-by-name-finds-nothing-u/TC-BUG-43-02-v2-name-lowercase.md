---
id: TC-BUG-43-02
type: happy
layer: functional
covers: ["Steps to Reproduce: step 2", "Expected: step 2 returns the same four items with count 4"]
priority: P1
---

# TC-BUG-43-02: v2 search with name=explorer (all lower case) returns the same four Explorer items

## Why

- This is the reported defect: a lower-case search returned count 0. It is the core regression case. Functional layer because the defect lives in the query translated to Postgres, so an in-memory unit test would not prove the database comparison.

## Preconditions

- Catalog functional host (`tests/Catalog.FunctionalTests`, `CatalogApiFixture`) seeded with the demo catalog (`src/Catalog.API/Setup/catalog.json`, the same 101 items as the test stack `default` scenario).
- Exactly four items have a name starting with "Explorer": "Explorer 45L Backpack" (Bags, Solstix), "Explorer Biking Computer" (Navigation, B&R), "Explorer Camping Tent" (Trekking, B&R), "Explorer Frost Boots" (Footwear, Daybird). No other item name starts with "explorer" in any letter case.

## Steps

1. Anonymous `GET /api/catalog/items?api-version=2.0&name=explorer`.

## Expected result

- Status 200.
- Body `count` is 4.
- `data` holds exactly 4 items, in this order:
  1. "Explorer 45L Backpack"
  2. "Explorer Biking Computer"
  3. "Explorer Camping Tent"
  4. "Explorer Frost Boots"
- The items (ids and names) are identical to those returned by TC-BUG-43-01.
