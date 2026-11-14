---
id: TC-BUG-17-04
type: happy
layer: functional
covers: ["Regression: valid create unchanged"]
priority: P1
---

# TC-BUG-17-04: POST with a name still returns 201 with Location

## Why

- Guards against the validator rejecting good input; the fix touches the only create path, so a happy-path regression case is required.

## Preconditions

- Catalog API running in-process via `CatalogApiFixture` against real Postgres, scenario `default` (101 items, brand id 1, type id 1); anonymous caller (the fixture's default client).

## Steps

1. `POST /api/catalog/items?api-version=2.0` with JSON body `{"id":0,"name":"BUG-17 Valid Item","catalogBrandId":1,"catalogTypeId":1,"description":"Valid","price":10.5,"availableStock":5,"restockThreshold":1,"maxStockThreshold":10}` (id 0 means server-generated).
2. Read the `Location` header and `GET` that path with `?api-version=2.0`.

## Expected result

- Step 1 returns 201 with a `Location` header starting with `/api/catalog/items/`.
- Step 2 returns 200 and the body `name` is `BUG-17 Valid Item`.
