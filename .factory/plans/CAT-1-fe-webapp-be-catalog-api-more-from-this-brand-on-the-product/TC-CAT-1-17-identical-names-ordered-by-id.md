---
id: TC-CAT-1-17
type: happy
layer: functional
covers: ["Implementation Notes: Id is the tie-breaker", "Outputs: ordered by name"]
priority: P2
---

# TC-CAT-1-17: Items with identical names are ordered by id

## Why

- The story's Decisions state Id breaks ties between identical names. Risk: nondeterministic order that makes pages flaky. Brand 17 has two items both named "Twin Mug" (ids 1013 and 1014).

## Preconditions

- Scenario `brand-mates` (`extends: default`) adds brands 14 "Peak Gear", 15 "Solo Gear", 16 "Trail Co" and 17 "Twin Gear" and these `Catalog` rows (CatalogTypeId 1, PictureFileName `<id>.webp`):

| Id | Name | Price | AvailableStock | CatalogBrandId |
| --- | --- | --- | --- | --- |
| 1001 | Charlie Rope | 20.00 | 10 | 14 |
| 1002 | Beta Stove | 30.00 | 10 | 14 |
| 1003 | Delta Lamp | 15.50 | 10 | 14 |
| 1004 | Echo Boots | 45.00 | 0 | 14 |
| 1005 | Foxtrot Mat | 25.00 | 10 | 14 |
| 1006 | Zulu Pack | 60.00 | 10 | 14 |
| 1007 | alpha Tent | 120.00 | 10 | 14 |
| 1008 | Lone Compass | 12.00 | 10 | 15 |
| 1009 | Kilo Stick | 18.00 | 10 | 16 |
| 1010 | Juliet Cup | 9.50 | 10 | 16 |
| 1011 | India Rope | 22.00 | 10 | 16 |
| 1012 | Anchor | 5.00 | 10 | 17 |
| 1013 | Twin Mug | 7.00 | 10 | 17 |
| 1014 | Twin Mug | 8.00 | 10 | 17 |

No item with id 999999 exists.
- Functional test: Catalog.API in-process against the real Postgres of `CatalogApiFixture`, loaded with the `brand-mates` data above. No Authorization header.

## Steps

1. `GET /api/catalog/items/1012/brand-mates?api-version=1.0`.
2. `GET /api/catalog/items/1012/brand-mates?count=1&api-version=1.0`.

## Expected result

- Step 1: status `200`; array of exactly 2 items with ids `[1013, 1014]` in this order (both named "Twin Mug").
- Step 2: status `200`; array of exactly 1 item with id `1013`.
