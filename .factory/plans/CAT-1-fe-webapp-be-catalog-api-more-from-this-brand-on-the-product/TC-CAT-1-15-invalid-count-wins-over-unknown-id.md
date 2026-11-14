---
id: TC-CAT-1-15
type: sad
sad-path: validation
layer: functional
covers: ["Implementation Notes: count is validated before the item lookup", "Outputs: 400 when count out of range"]
priority: P2
---

# TC-CAT-1-15: Out-of-range count on an unknown id is 400, not 404

## Why

- The story's Decisions state count is validated before the item lookup. Risk: reordering the checks would turn this into 404. Functional layer, one request.

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

1. `GET /api/catalog/items/999999/brand-mates?count=0&api-version=1.0`.

## Expected result

- Status `400` (not `404`).
- Content type `application/problem+json`; body is a problem details object with `status` 400.
