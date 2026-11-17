---
id: TC-BUG-43-06
type: happy
layer: functional
covers: ["Expected: paging is unchanged"]
priority: P2
---

# TC-BUG-43-06: Paging applies to a lower-case name search: second page of size 2 holds the last two Explorer items

## Why

- The ticket says paging is unchanged. The total `count` must stay the full match count (4) while `data` holds only the requested page, in name order; a fix that counted or paged a different query would break this. Functional layer because count and Skip/Take run against the database.

## Preconditions

- Catalog functional host (`tests/Catalog.FunctionalTests`, `CatalogApiFixture`) seeded with the demo catalog (`src/Catalog.API/Setup/catalog.json`, the same 101 items as the test stack `default` scenario).
- Exactly four items have a name starting with "Explorer": "Explorer 45L Backpack" (Bags, Solstix), "Explorer Biking Computer" (Navigation, B&R), "Explorer Camping Tent" (Trekking, B&R), "Explorer Frost Boots" (Footwear, Daybird). No other item name starts with "explorer" in any letter case.

## Steps

1. Anonymous `GET /api/catalog/items?api-version=2.0&name=explorer&PageSize=2&PageIndex=1`.

## Expected result

- Status 200.
- Body `pageIndex` is 1, `pageSize` is 2, `count` is 4.
- `data` holds exactly 2 items, in this order:
  1. "Explorer Camping Tent"
  2. "Explorer Frost Boots"
