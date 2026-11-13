---
id: TC-BUG-17-02
type: sad
sad-path: validation
layer: functional
covers: ["Expected: 400 BadRequest with a validation problem"]
priority: P2
---

# TC-BUG-17-02: POST create item with name null returns 400

## Why

- A JSON null name is a distinct input from an absent property; both must be rejected before the database.

## Preconditions

- Catalog.API in-process via `CatalogApiFixture`, scenario `default` (101 items; brand 1, type 1 and item 1 exist), anonymous.

## Steps

1. `POST /api/catalog/items?api-version=2.0` with JSON body `{"description":"Test item","price":10.5,"catalogBrandId":1,"catalogTypeId":1,"name":null}`.

## Expected result

- Status is 400 (not 500).
- Body is JSON ProblemDetails-shaped with a non-empty `detail` field.
- No `Location` header is returned.
