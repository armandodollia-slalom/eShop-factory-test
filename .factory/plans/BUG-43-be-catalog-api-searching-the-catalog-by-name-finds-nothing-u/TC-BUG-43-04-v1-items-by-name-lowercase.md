---
id: TC-BUG-43-04
type: happy
layer: functional
covers: ["Steps to Reproduce: step 4", "Expected: step 4 (v1 /items/by/{name}) returns the same four items with count 4"]
priority: P1
---

# TC-BUG-43-04: v1 GET /items/by/explorer returns the same four Explorer items

## Why

- The v1 by-name route is a separate public endpoint in the ticket's reproduction; it must be fixed too, not only the v2 query parameter. Functional layer to hit the real v1 route with its `minlength(1)` constraint and the real database.

## Preconditions

- Catalog functional host (`tests/Catalog.FunctionalTests`, `CatalogApiFixture`) seeded with the demo catalog (`src/Catalog.API/Setup/catalog.json`, the same 101 items as the test stack `default` scenario).
- Exactly four items have a name starting with "Explorer": "Explorer 45L Backpack" (Bags, Solstix), "Explorer Biking Computer" (Navigation, B&R), "Explorer Camping Tent" (Trekking, B&R), "Explorer Frost Boots" (Footwear, Daybird). No other item name starts with "explorer" in any letter case.

## Steps

1. Anonymous `GET /api/catalog/items/by/explorer?api-version=1.0`.

## Expected result

- Status 200.
- Body `count` is 4.
- `data` holds exactly 4 items, in this order:
  1. "Explorer 45L Backpack"
  2. "Explorer Biking Computer"
  3. "Explorer Camping Tent"
  4. "Explorer Frost Boots"
- The items (ids and names) are identical to those returned by TC-BUG-43-01.
