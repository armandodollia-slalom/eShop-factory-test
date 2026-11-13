---
id: TC-BUG-17-01
type: sad
sad-path: validation
layer: functional
covers: ["Expected: 400 BadRequest with a validation problem", "Technical Notes: CreateItem validation"]
priority: P1
---

# TC-BUG-17-01: POST without a name field is rejected with 400 (v2)

## Why

- This is the reported bug: a body with no name reached Postgres and returned 500 from a NOT NULL violation. Functional layer because it needs the real database to prove no 500 and no persisted row.

## Preconditions

- Catalog API running in-process via CatalogApiFixture against the default scenario (101 items; item 1 exists). Anonymous client with the api-version header/query set as in CatalogApiTests.

## Steps

1. `POST /api/catalog/items?api-version=2.0` with JSON body `{"description":"No name","price":10.0,"catalogBrandId":1,"catalogTypeId":1,"availableStock":5}` (no `name` property).

## Expected result

- Status code is 400 (not 500).
- Body is an HttpValidationProblemDetails: `errors.Name` is a non-empty array containing "The Name field is required." and `detail` is "Item name must be provided in the request body.".
- No row is added: `GET /api/catalog/items?pageIndex=0&pageSize=1&api-version=2.0` still reports `count` 101.
