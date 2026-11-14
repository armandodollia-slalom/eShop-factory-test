---
id: TC-BUG-19-08
type: happy
layer: functional
covers: ["Boundary: highest existing ids accepted", "Happy path unchanged"]
priority: P1
---

# TC-BUG-19-08: POST with the highest existing brand id (13) and type id (8) succeeds

## Why

- Proves the check does not over-reject: existing ids at the top of the seeded range pass and the item is persisted.

## Preconditions

- Catalog API in-process on the functional fixture with the `default` scenario (13 brands with ids 1-13, 8 types with ids 1-8, 101 items, item 1 exists). Anonymous caller.

## Steps

1. `POST /api/catalog/items?api-version=2.0` with body `{"name":"Valid Refs Item","description":"d","price":10.0,"pictureFileName":"1.webp","catalogTypeId":8,"catalogBrandId":13,"availableStock":5,"restockThreshold":1,"maxStockThreshold":10}`.
2. `GET /api/catalog/items?api-version=2.0&pageIndex=0&pageSize=200`.

## Expected result

- Step 1: status 201 with a `Location` header ending in `/api/catalog/items/<new id>`.
- Step 2: the list contains `Valid Refs Item` with `catalogBrand.id` 13 and `catalogType.id` 8; total count is 102.
