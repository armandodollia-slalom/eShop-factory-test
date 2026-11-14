---
id: TC-BUG-17-02
type: sad
sad-path: validation
layer: functional
covers: ["Expected: 400 BadRequest with a validation problem"]
priority: P1
---

# TC-BUG-17-02: POST with name set to null returns 400

## Why

- Explicit null is a distinct wire form of a missing name (property present, value null); proves the validator treats both the same.

## Preconditions

- Catalog API running in-process via `CatalogApiFixture` against real Postgres, scenario `default` (101 items, brand id 1, type id 1); anonymous caller (the fixture's default client).

## Steps

1. `POST /api/catalog/items?api-version=2.0` with JSON body `{"name":null,"catalogBrandId":1,"catalogTypeId":1,"description":"Null name","price":10.5,"availableStock":5,"restockThreshold":1,"maxStockThreshold":10}`.

## Expected result

- Status is 400.
- The response body is non-empty and is a ProblemDetails JSON (it has a `detail` property).
