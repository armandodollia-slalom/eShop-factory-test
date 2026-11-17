---
id: TC-BUG-43-08
type: happy
layer: functional
covers: ["Expected: the type filter is unchanged"]
priority: P2
---

# TC-BUG-43-08: Type filter still narrows an upper-case name search to the one Footwear Explorer item

## Why

- The ticket says the type filter is unchanged; the name and type predicates must still combine. Only one Explorer item is Footwear, so the filter's effect is observable. Separate from the brand case because the two filters are separate predicates. Functional layer for the combined database query.

## Preconditions

- Catalog functional host (`tests/Catalog.FunctionalTests`, `CatalogApiFixture`) seeded with the demo catalog (`src/Catalog.API/Setup/catalog.json`, the same 101 items as the test stack `default` scenario).
- Exactly four items have a name starting with "Explorer": "Explorer 45L Backpack" (Bags, Solstix), "Explorer Biking Computer" (Navigation, B&R), "Explorer Camping Tent" (Trekking, B&R), "Explorer Frost Boots" (Footwear, Daybird). No other item name starts with "explorer" in any letter case.
- The id of type "Footwear" is read from `GET /api/catalog/catalogtypes?api-version=2.0` (call it `<footwear>`).

## Steps

1. Anonymous `GET /api/catalog/items?api-version=2.0&name=EXPLORER&type=<footwear>`.

## Expected result

- Status 200.
- Body `count` is 1.
- `data` holds exactly 1 item: "Explorer Frost Boots", with `catalogTypeId` = `<footwear>`.
