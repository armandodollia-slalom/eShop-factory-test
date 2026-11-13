---
id: TC-BUG-17-06
type: happy
layer: functional
covers: ["Decisions: shared validation must not reject valid names"]
priority: P1
---

# TC-BUG-17-06: POST create item with a valid name still returns 201

## Why

- Regression guard: the new validation must not block valid creation.

## Preconditions

- Catalog.API in-process via `CatalogApiFixture`, scenario `default` (101 items; brand 1, type 1 and item 1 exist), anonymous.

## Steps

1. `POST /api/catalog/items?api-version=2.0` with JSON body `{"description":"Test item","price":10.5,"catalogBrandId":1,"catalogTypeId":1,"name":"BUG-17 Valid Item"}`.
2. `GET` the URL in the `Location` header.

## Expected result

- Step 1 returns 201 with a `Location` header ending `/api/catalog/items/{id}`.
- Step 2 returns 200 and `name` equals `BUG-17 Valid Item`.
