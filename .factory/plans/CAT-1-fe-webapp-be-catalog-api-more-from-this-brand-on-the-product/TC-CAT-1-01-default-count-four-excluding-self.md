---
id: TC-CAT-1-01
type: happy
layer: functional
covers: ["Outputs: 200 array, other items of same brand, never item id itself, ordered by name, at most count items", "AC1", "Inputs: count default 4"]
priority: P1
---

# TC-CAT-1-01: Default count returns the first four other items by name, without the item itself

## Why

- Requirement: AC1 and the default of `count`. Risk: self included, wrong order or wrong default. Item 1001 sits inside the first four by name, so a missing self-exclusion is visible. Functional because it is an API contract against real Postgres. The request is anonymous, which covers the anonymous-read rule.

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

Ordinal (code point) name order of the six other items of item 1001: Beta Stove (1002), Delta Lamp (1003), Echo Boots (1004), Foxtrot Mat (1005), Zulu Pack (1006), alpha Tent (1007) (lowercase "alpha" sorts after "Zulu" ordinally). No item with id 999999 exists.
- Functional test: Catalog.API in-process against the real Postgres of `CatalogApiFixture`, loaded with the `brand-mates` data above. No Authorization header is sent.

## Steps

1. `GET /api/catalog/items/1001/brand-mates?api-version=1.0` with no Authorization header.

## Expected result

- Status `200`, JSON array of exactly 4 items.
- Names in order: Beta Stove, Delta Lamp, Echo Boots, Foxtrot Mat (ids 1002, 1003, 1004, 1005).
- No element has id 1001; no element has a brand other than Peak Gear (brandId 14).
