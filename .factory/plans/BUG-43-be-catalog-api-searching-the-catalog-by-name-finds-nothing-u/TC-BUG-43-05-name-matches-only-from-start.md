---
id: TC-BUG-43-05
type: sad
sad-path: boundary
layer: functional
covers: ["Expected: the name still matches from the start of the item's name (name=Backpack returns no items)"]
priority: P1
---

# TC-BUG-43-05: v2 search with name=Backpack returns no items (match stays anchored at the start of the name)

## Why

- The ticket keeps starts-with semantics; a fix that switched to a contains match (for example `ILIKE '%x%'`) would make the search case-insensitive but wrongly return the many items whose names end in "Backpack". This is the boundary of the change. Functional layer for the real database query.

## Preconditions

- Catalog functional host (`tests/Catalog.FunctionalTests`, `CatalogApiFixture`) seeded with the demo catalog (`src/Catalog.API/Setup/catalog.json`, the same 101 items as the test stack `default` scenario).
- Exactly four items have a name starting with "Explorer": "Explorer 45L Backpack" (Bags, Solstix), "Explorer Biking Computer" (Navigation, B&R), "Explorer Camping Tent" (Trekking, B&R), "Explorer Frost Boots" (Footwear, Daybird). No other item name starts with "explorer" in any letter case.
- Several item names contain "Backpack" but none starts with it, e.g. "Explorer 45L Backpack", "Expedition Backpack", "Trailblazer 45L Backpack", "Trailblaze hiking backpack".

## Steps

1. Anonymous `GET /api/catalog/items?api-version=2.0&name=Backpack`.

## Expected result

- Status 200.
- Body `count` is 0.
- `data` is an empty array.
- In particular "Explorer 45L Backpack" and "Trailblaze hiking backpack" are NOT returned.
