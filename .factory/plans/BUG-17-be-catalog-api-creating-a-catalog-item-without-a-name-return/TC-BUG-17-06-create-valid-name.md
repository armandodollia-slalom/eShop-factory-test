---
id: TC-BUG-17-06
type: happy
layer: functional
covers: ["Regression: valid create still succeeds"]
priority: P1
---

# TC-BUG-17-06: POST with a valid name still creates the item

## Why

- Guards against the validator rejecting valid bodies; proves the 400 path does not break the success path.

## Preconditions

- Catalog API running in-process via CatalogApiFixture against the default scenario (101 items; item 1 exists). Anonymous client with the api-version header/query set as in CatalogApiTests.

## Steps

1. `POST /api/catalog/items?api-version=2.0` with JSON body `{"name":"BUG-17 Test Item","description":"Valid","price":10.0,"catalogBrandId":1,"catalogTypeId":1,"availableStock":5}`.
2. `GET /api/catalog/items?name=BUG-17%20Test%20Item&pageIndex=0&pageSize=5&api-version=2.0`.
3. Cleanup: `DELETE /api/catalog/items/{id}` of the created item.

## Expected result

- Step 1: status 201 and a `Location` header `/api/catalog/items/{id}`.
- Step 2: 200 with exactly one item named "BUG-17 Test Item".
- Step 3: 204.
