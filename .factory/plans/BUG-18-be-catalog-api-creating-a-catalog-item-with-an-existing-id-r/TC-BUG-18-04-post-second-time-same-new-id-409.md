---
id: TC-BUG-18-04
type: sad
sad-path: conflict
layer: functional
covers: ["Expected: 409 Conflict","Duplicate of an id created through the API"]
priority: P2
---

# TC-BUG-18-04: Posting the same newly created id twice returns 409 the second time

## Why

- Proves the check sees rows inserted via the API, not only seeded ones, and that the first create is not undone.

## Preconditions

- Catalog API running in-process via `CatalogApiFixture` against real Postgres, scenario `default` (101 items; item 1 is "Wanderer Black Hiking Boots"; brand id 1, type id 1); anonymous caller (the fixture's default client). No item with id 5001 exists.

## Steps

1. `POST /api/catalog/items?api-version=2.0` with JSON body `{"id":5001,"name":"First of two","catalogBrandId":1,"catalogTypeId":1,"description":"Plan case","price":10.5,"availableStock":5,"restockThreshold":1,"maxStockThreshold":10}`.
2. `POST /api/catalog/items?api-version=2.0` with the same body `{"id":5001,"name":"Second of two","catalogBrandId":1,"catalogTypeId":1,"description":"Plan case","price":10.5,"availableStock":5,"restockThreshold":1,"maxStockThreshold":10}`.
3. `GET /api/catalog/items/5001?api-version=2.0`.

## Expected result

- Step 1 status is 201.
- Step 2 status is 409.
- Step 3 returns 200 with `name` `First of two`.
