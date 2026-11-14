---
id: TC-BUG-17-01
type: sad
sad-path: validation
layer: functional
covers: ["Expected: 400 BadRequest with a validation problem", "Reproduction step 1"]
priority: P1
---

# TC-BUG-17-01: POST without a name property returns 400

## Why

- This is the reported bug: a missing name reached Postgres and produced a 500. Functional layer because it needs the real NOT NULL column to prove the database is never reached.

## Preconditions

- Catalog API running in-process via `CatalogApiFixture` against real Postgres, scenario `default` (101 items, brand id 1, type id 1); anonymous caller (the fixture's default client).

## Steps

1. `POST /api/catalog/items?api-version=2.0` with JSON body `{"catalogBrandId":1,"catalogTypeId":1,"description":"No name","price":10.5,"availableStock":5,"restockThreshold":1,"maxStockThreshold":10}` (no `name` property).

## Expected result

- Status is 400 (not 500).
- The response body is non-empty and is a ProblemDetails JSON (it has a `detail` property).
- No `Location` header.
