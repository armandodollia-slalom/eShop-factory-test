---
id: TC-BUG-17-04
type: sad
sad-path: boundary
layer: functional
covers: ["Decisions: whitespace name rejected"]
priority: P2
---

# TC-BUG-17-04: POST create item with whitespace-only name returns 400

## Why

- Boundary of the check: a non-empty but blank name must be rejected too.

## Preconditions

- Catalog.API in-process via `CatalogApiFixture`, scenario `default` (101 items; brand 1, type 1 and item 1 exist), anonymous.

## Steps

1. `POST /api/catalog/items?api-version=2.0` with JSON body `{"description":"Test item","price":10.5,"catalogBrandId":1,"catalogTypeId":1,"name":"   "}`.

## Expected result

- Status is 400 (not 500).
- Body is JSON ProblemDetails-shaped with a non-empty `detail` field.
- No `Location` header is returned.
