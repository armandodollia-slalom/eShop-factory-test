---
id: TC-BUG-18-03
type: sad
sad-path: conflict
layer: functional
covers: ["Expected: 409 Conflict"]
priority: P2
---

# TC-BUG-18-03: POST create with an existing id returns 409 under api-version 1.0 too

## Why

- CreateItem is mapped on the shared route group, so both API versions must give the same result; guards against a fix applied to one version only.

## Preconditions

- Catalog.API in-process via `CatalogApiFixture`, scenario `default` (101 items; item 1 exists, brand 1 and type 1 exist), anonymous.

## Steps

1. `POST /api/catalog/items?api-version=1.0` with body `{"id":1,"name":"Duplicate item","price":10.5,"catalogBrandId":1,"catalogTypeId":1}`.

## Expected result

- Status is 409 (not 500).
- Body is ProblemDetails-shaped with a non-empty `detail` field.
