---
id: TC-BUG-18-06
type: sad
sad-path: conflict
layer: functional
covers: ["Expected: 409 Conflict", "Steps to Reproduce 1"]
priority: P2
---

# TC-BUG-18-06: Creating the same new explicit id twice returns 201 then 409

## Why

- Shows the check applies to items created through the API, not only seeded data, and that the first create is not affected.

## Preconditions

- Catalog.API in-process via `CatalogApiFixture`, scenario `default` (101 items; item 1 exists, brand 1 and type 1 exist), anonymous.
- No item has id 5001.

## Steps

1. `POST /api/catalog/items?api-version=2.0` with body `{"id":5001,"name":"First","price":10.5,"catalogBrandId":1,"catalogTypeId":1}`.
2. Repeat the identical request with `"name":"Second"`.
3. `GET /api/catalog/items/5001?api-version=2.0`.

## Expected result

- Step 1 returns 201.
- Step 2 returns 409 with a ProblemDetails `detail`.
- Step 3 returns 200 with name "First".
