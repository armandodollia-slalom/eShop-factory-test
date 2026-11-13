---
id: TC-BUG-17-01
type: sad
sad-path: validation
layer: functional
covers: ["Expected: 400 BadRequest with a validation problem", "Steps to Reproduce 1"]
priority: P1
---

# TC-BUG-17-01: POST create item with no name property returns 400, not 500

## Why

- This is the reported bug: a body with no `name` made Postgres raise a NOT NULL violation and returned 500. Functional layer is the cheapest that reaches real Postgres, where the 500 originated.

## Preconditions

- Catalog.API in-process via `CatalogApiFixture`, scenario `default` (101 items; brand 1, type 1 and item 1 exist), anonymous.

## Steps

1. `POST /api/catalog/items?api-version=2.0` with JSON body `{"description":"Test item","price":10.5,"catalogBrandId":1,"catalogTypeId":1}` (no `name` property).

## Expected result

- Status is 400 (not 500).
- Body is JSON ProblemDetails-shaped with a non-empty `detail` field.
- No `Location` header is returned.
