---
id: TC-BUG-17-05
type: sad
sad-path: boundary
layer: functional
covers: ["Expected: 400 BadRequest", "Name whitespace-only"]
priority: P1
---

# TC-BUG-17-05: POST with whitespace-only name is rejected with 400

## Why

- Whitespace-only is treated as missing per the implementation notes; guards against a validator that only checks for empty.

## Preconditions

- Catalog API running in-process via CatalogApiFixture against the default scenario (101 items; item 1 exists). Anonymous client with the api-version header/query set as in CatalogApiTests.

## Steps

1. `POST /api/catalog/items?api-version=2.0` with JSON body `{"name":"   ","price":10.0,"catalogBrandId":1,"catalogTypeId":1,"availableStock":5}`.

## Expected result

- Status code is 400 (not 500).
- Body is an HttpValidationProblemDetails: `errors.Name` is a non-empty array containing "The Name field is required." and `detail` is "Item name must be provided in the request body.".
- No row is added: `GET /api/catalog/items?pageIndex=0&pageSize=1&api-version=2.0` still reports `count` 101.
