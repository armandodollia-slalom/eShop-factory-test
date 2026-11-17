---
id: TC-BUG-43-07
type: happy
layer: functional
covers: ["Expected: the brand filter is unchanged"]
priority: P2
---

# TC-BUG-43-07: Brand filter still narrows a lower-case name search to the B&R Explorer items

## Why

- The ticket says the brand filter is unchanged; the name and brand predicates must still combine (AND). Two of the four Explorer items are B&R, so the filter's effect is observable. Functional layer for the combined database query.

## Preconditions

- Catalog functional host (`tests/Catalog.FunctionalTests`, `CatalogApiFixture`) seeded with the demo catalog (`src/Catalog.API/Setup/catalog.json`, the same 101 items as the test stack `default` scenario).
- Exactly four items have a name starting with "Explorer": "Explorer 45L Backpack" (Bags, Solstix), "Explorer Biking Computer" (Navigation, B&R), "Explorer Camping Tent" (Trekking, B&R), "Explorer Frost Boots" (Footwear, Daybird). No other item name starts with "explorer" in any letter case.
- The id of brand "B&R" is read from `GET /api/catalog/catalogbrands?api-version=2.0` (call it `<brR>`).

## Steps

1. Anonymous `GET /api/catalog/items?api-version=2.0&name=explorer&brand=<brR>`.

## Expected result

- Status 200.
- Body `count` is 2.
- `data` holds exactly 2 items, in this order:
  1. "Explorer Biking Computer"
  2. "Explorer Camping Tent"
- Every returned item has `catalogBrandId` = `<brR>`; "Explorer 45L Backpack" (Solstix) and "Explorer Frost Boots" (Daybird) are NOT returned.
