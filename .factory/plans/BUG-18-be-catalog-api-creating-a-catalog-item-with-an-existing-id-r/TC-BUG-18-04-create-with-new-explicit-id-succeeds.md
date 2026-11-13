---
id: TC-BUG-18-04
type: happy
layer: functional
covers: ["Expected: client ids that do not collide are accepted"]
priority: P1
---

# TC-BUG-18-04: POST create with an unused explicit id returns 201 and keeps that id

## Why

- The fix must not break non-colliding creates that set an id (the chosen option keeps client-supplied ids). Prevents over-rejecting.

## Preconditions

- Catalog.API in-process via `CatalogApiFixture`, scenario `default` (101 items; item 1 exists, brand 1 and type 1 exist), anonymous.
- No item has id 5000.

## Steps

1. `POST /api/catalog/items?api-version=2.0` with body `{"id":5000,"name":"Explicit id item","price":10.5,"catalogBrandId":1,"catalogTypeId":1}`.
2. `GET /api/catalog/items/5000?api-version=2.0`.

## Expected result

- Step 1 returns 201 with `Location` ending `/api/catalog/items/5000`.
- Step 2 returns 200 with name "Explicit id item".
