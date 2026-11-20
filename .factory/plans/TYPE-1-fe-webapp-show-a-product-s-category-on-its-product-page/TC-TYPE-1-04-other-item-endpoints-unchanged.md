---
id: TC-TYPE-1-04
type: happy
layer: functional
covers: ["AC3: the other catalog endpoints are unchanged (items by ids, brand mates)"]
priority: P2
---

# TC-TYPE-1-04: Items-by-ids and brand-mates endpoints still return items without their type

## Why

- These are the other item endpoints next to `GetItemById` that load single items or item lists for the product page ("More from …" uses brand mates). AC3 says they are unchanged, so they must keep returning items with the brand but without the type. One case for both, since the observable rule is the same.

## Preconditions

- Demo catalog: items 1, 2 and 3 exist; brand 1 "Daybird" has 10 items including item 1.

## Steps

1. Anonymous `GET /api/catalog/items/by?ids=1&ids=2&ids=3&api-version=1.0`.
2. Anonymous `GET /api/catalog/items/1/brand-mates?api-version=1.0`.

## Expected result

- Step 1: status 200, 3 items with ids 1, 2 and 3; every item has `catalogType` null.
- Step 2: status 200, 4 items, none with `id` 1, all with `catalogBrandId` 1 and non-null `catalogBrand`; every item has `catalogType` null.
