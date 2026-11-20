---
id: TC-BRAND-1-03
type: happy
layer: functional
covers: ["AC5: lowestPrice is null for a brand without products", "Implementation Notes: left join, brands without items get 0 and null"]
priority: P1
---

# TC-BRAND-1-03: Summary endpoint returns itemCount 0 and lowestPrice null for a brand without products

## Why

- AC5 requires a brand without products to be listed with `lowestPrice` null; an inner join would drop it entirely and the page could never show "No products yet" (AC4). The demo catalog has no such brand, so the case adds one. Functional is the cheapest layer with the real left join in Postgres.

## Preconditions

- The case runs in its own functional test class with its own `CatalogApiFixture` instance (its own catalog database), not in `CatalogApiTests`, and no test that changes catalog data shares that database. `CatalogApiTests` reprices item 1 (Daybird), deletes items 5 (B&R) and 6 (Raptor Elite) and adds an item to brand 13 (XE), so the exact demo values only hold in an unshared database.
- That database holds the unchanged demo catalog the fixture seeds: 13 brands (ids 1 to 13), 101 items.
- The test inserts brand `{ Id: 14, Brand: "Acme Empty" }` into `CatalogBrands` through the host's `CatalogContext`, with no catalog items, and removes it after the case, so TC-BRAND-1-01 and TC-BRAND-1-02 still see only the demo catalog when they share this class's database.

## Steps

1. Send `GET /api/catalog/catalogbrands/summary?api-version=1.0` anonymously.

## Expected result

- Status `200`.
- The array has 14 entries; the entry with `id` 14 is `{ "id": 14, "brand": "Acme Empty", "itemCount": 0, "lowestPrice": null }` (the `lowestPrice` property is present with value null).
- That entry is the first in the array (before "AirStrider"), consistent with name order.
- The sum of `itemCount` over all entries is still 101.
