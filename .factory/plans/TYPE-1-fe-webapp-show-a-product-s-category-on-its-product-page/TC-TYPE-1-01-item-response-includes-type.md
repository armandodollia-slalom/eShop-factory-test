---
id: TC-TYPE-1-01
type: happy
layer: functional
covers: ["AC3: GET /api/catalog/items/{id} includes the item's type (id and name)", "AC3: as it already includes its brand"]
priority: P1
---

# TC-TYPE-1-01: Single-item response of item 1 includes its type Footwear next to its brand

## Why

- AC3 is the API contract the page depends on: without `.Include(CatalogType)` the item arrives with `catalogType: null` and the page renders an empty Category. The functional layer runs the real EF query against Postgres, which is where a missing include shows up, and is cheaper than going through the UI. Both API versions are checked because the route is mapped on the shared `api` group.

## Preconditions

- Catalog functional host (`CatalogApiFixture`) with the demo catalog: item 1 "Wanderer Black Hiking Boots", `catalogTypeId` 1, `catalogBrandId` 1; type 1 is "Footwear"; brand 1 is "Daybird".

## Steps

1. Anonymous `GET /api/catalog/items/1?api-version=1.0`.
2. Anonymous `GET /api/catalog/items/1?api-version=2.0`.

## Expected result

- Both responses: status 200, JSON body with `id` 1, `name` "Wanderer Black Hiking Boots".
- `catalogTypeId` is 1 and `catalogType` is an object with `id` 1 and `type` "Footwear" (not null).
- `catalogBrandId` is 1 and `catalogBrand` is an object with `id` 1 and `brand` "Daybird" (the brand is still included).
