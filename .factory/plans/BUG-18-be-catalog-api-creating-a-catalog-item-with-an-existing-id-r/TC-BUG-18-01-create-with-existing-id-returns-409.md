---
id: TC-BUG-18-01
type: sad
sad-path: conflict
layer: functional
covers: ["Expected: 409 Conflict", "Steps to Reproduce 1"]
priority: P1
---

# TC-BUG-18-01: POST create item with an existing id returns 409 Conflict, not 500

## Why

- This is the reported bug: id 1 collided with the primary key and Postgres raised a violation surfacing as 500. Functional layer reaches the real Postgres where the 500 originated.

## Preconditions

- Catalog.API in-process via `CatalogApiFixture`, scenario `default` (101 items; item 1 exists, brand 1 and type 1 exist), anonymous.

## Steps

1. `POST /api/catalog/items?api-version=2.0` with JSON body `{"id":1,"name":"Duplicate item","price":10.5,"catalogBrandId":1,"catalogTypeId":1}`.

## Expected result

- Status is 409 (not 500).
- Body is JSON ProblemDetails-shaped with a non-empty `detail` field.
- No `Location` header is returned.
