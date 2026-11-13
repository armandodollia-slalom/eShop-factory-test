---
id: TC-BUG-17-03
type: sad
sad-path: validation
layer: functional
covers: ["Decisions: empty name rejected"]
priority: P1
---

# TC-BUG-17-03: POST create item with empty name returns 400

## Why

- Implementation decision: empty names are rejected by the same check as missing ones.

## Preconditions

- Catalog.API in-process via `CatalogApiFixture`, scenario `default` (101 items; brand 1, type 1 and item 1 exist), anonymous.

## Steps

1. `POST /api/catalog/items?api-version=2.0` with JSON body `{"description":"Test item","price":10.5,"catalogBrandId":1,"catalogTypeId":1,"name":""}`.

## Expected result

- Status is 400 (not 500).
- Body is JSON ProblemDetails-shaped with a non-empty `detail` field.
- No `Location` header is returned.
