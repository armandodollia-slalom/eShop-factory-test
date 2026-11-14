---
id: TC-BUG-18-02
type: sad
sad-path: conflict
layer: functional
covers: ["Expected: 409 Conflict","Rejected request must not alter data"]
priority: P1
---

# TC-BUG-18-02: Rejected duplicate POST leaves item 1 and the catalog count unchanged

## Why

- Guards against a fix that returns 409 but still overwrites or adds a row; the rejection must have no side effects.

## Preconditions

- Catalog API running in-process via `CatalogApiFixture` against real Postgres, scenario `default` (101 items; item 1 is "Wanderer Black Hiking Boots"; brand id 1, type id 1); anonymous caller (the fixture's default client). 

## Steps

1. `GET /api/catalog/items?api-version=2.0&pageIndex=0&pageSize=1` and record `count`.
2. `POST /api/catalog/items?api-version=2.0` with JSON body `{"id":1,"name":"Duplicate of one","catalogBrandId":1,"catalogTypeId":1,"description":"Plan case","price":10.5,"availableStock":5,"restockThreshold":1,"maxStockThreshold":10}`.
3. `GET /api/catalog/items/1?api-version=2.0`.
4. `GET /api/catalog/items?api-version=2.0&pageIndex=0&pageSize=1` again.

## Expected result

- Step 2 status is 409.
- Step 3 returns 200 with `name` equal to `Wanderer Black Hiking Boots` (not `Duplicate of one`).
- Step 4 `count` equals the value recorded in step 1 (101).
