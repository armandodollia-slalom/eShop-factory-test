---
id: TC-BUG-43-03
type: happy
layer: functional
covers: ["Steps to Reproduce: step 3", "Expected: step 3 returns the same four items with count 4"]
priority: P1
---

# TC-BUG-43-03: v2 search with name=EXPLORER (all upper case) returns the same four Explorer items

## Why

- The ticket names upper-case search text separately from lower case; a fix that only lower-cases the stored name (or only the input) would pass TC-BUG-43-02 but fail here. Same layer reasoning as TC-BUG-43-02.

## Preconditions

- Catalog functional host (`tests/Catalog.FunctionalTests`, `CatalogApiFixture`) seeded with the demo catalog (`src/Catalog.API/Setup/catalog.json`, the same 101 items as the test stack `default` scenario).
- Exactly four items have a name starting with "Explorer": "Explorer 45L Backpack" (Bags, Solstix), "Explorer Biking Computer" (Navigation, B&R), "Explorer Camping Tent" (Trekking, B&R), "Explorer Frost Boots" (Footwear, Daybird). No other item name starts with "explorer" in any letter case.

## Steps

1. Anonymous `GET /api/catalog/items?api-version=2.0&name=EXPLORER`.

## Expected result

- Status 200.
- Body `count` is 4.
- `data` holds exactly 4 items, in this order:
  1. "Explorer 45L Backpack"
  2. "Explorer Biking Computer"
  3. "Explorer Camping Tent"
  4. "Explorer Frost Boots"
- The items (ids and names) are identical to those returned by TC-BUG-43-01.
