---
id: TC-BUG-18-01
type: sad
sad-path: conflict
layer: functional
covers: ["Expected: 409 Conflict","Reproduction step 1"]
priority: P1
---

# TC-BUG-18-01: POST with an existing id returns 409 Conflict

## Why

- This is the reported bug: a client-supplied id that exists reached Postgres and produced a 500 from a primary key violation. Functional layer because the real PK constraint is what failed.

## Preconditions

- Catalog API running in-process via `CatalogApiFixture` against real Postgres, scenario `default` (101 items; item 1 is "Wanderer Black Hiking Boots"; brand id 1, type id 1); anonymous caller (the fixture's default client). 

## Steps

1. `POST /api/catalog/items?api-version=2.0` with JSON body `{"id":1,"name":"Duplicate of one","catalogBrandId":1,"catalogTypeId":1,"description":"Plan case","price":10.5,"availableStock":5,"restockThreshold":1,"maxStockThreshold":10}`.

## Expected result

- Status is 409 (not 500).
- The response body is non-empty ProblemDetails JSON (it has a `detail` property).
- No `Location` header.
