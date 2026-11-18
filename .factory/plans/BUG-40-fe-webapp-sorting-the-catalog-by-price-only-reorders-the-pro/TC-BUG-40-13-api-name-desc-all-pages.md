---
id: TC-BUG-40-13
type: happy
layer: functional
covers: ["Expected: Name: Z to A works the same way in its own order", "Implementation Notes: name sorts break ties by Id"]
priority: P2
---

# TC-BUG-40-13: API: name-desc orders all 101 items across every page

## Why

- "Name: Z to A" must span the whole catalog. Asserting the first and last pages plus completeness proves the order is applied before paging; full name-by-name comparison is avoided because it depends on database collation (see Open questions).

## Preconditions

- `CatalogApiFixture` seeded with the 101 catalog items. HTTP client with api-version `2.0`.

## Steps

1. For `pageIndex` = 0 to 11, send `GET /api/catalog/items?pageIndex=<n>&pageSize=9&sort=name-desc&api-version=2.0`.
2. Concatenate `data` from the 12 responses in page order.

## Expected result

- Every response is `200` with `count` = `101`.
- Page 0 has 9 items; its first seven `data[*].id` are exactly `[30, 46, 1, 55, 11, 9, 33]` (Zero Gravity Ski Goggles first, Venture Grey Trail Shoes seventh).
- Page 0 `data[7].id` and `data[8].id` are, as a set, `{22, 67}` (Venture 2022 Snowboard, Venture 2.0 40L Waterproof Duffel Bag); their relative order depends on the database collation and is not asserted.
- Page 11 `data[*].id` is exactly `[95, 99]` (AeroLite Cycling Helmet, Adventurer GPS Watch).
- The concatenated list has 101 distinct ids.
