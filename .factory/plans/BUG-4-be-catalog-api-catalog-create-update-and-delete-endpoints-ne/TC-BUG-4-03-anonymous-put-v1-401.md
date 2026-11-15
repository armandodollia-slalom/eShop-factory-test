---
id: TC-BUG-4-03
type: sad
sad-path: auth
layer: e2e
covers: ["Technical Notes: UpdateItemV1 mapped with no RequireAuthorization()", "Expected: 401 Unauthorized for anonymous callers"]
priority: P0
---

# TC-BUG-4-03: Anonymous v1 PUT /api/catalog/items returns 401 and leaves item 1 unchanged

## Why

- The Technical Notes list `UpdateItemV1` (`PUT /api/catalog/items`, id in the body) as a separate unprotected mapping. It is a distinct route from the v2 PUT, so protecting one does not protect the other; it needs its own case.

## Preconditions

- Test stack up with scenario `bug-4` loaded; item 1 has price `109.99`.

## Steps

1. With no `Authorization` header, `PUT {catalog}/api/catalog/items?api-version=1.0`, `Content-Type: application/json`, body `{"id":1,"name":"Wanderer Black Hiking Boots","description":"Anonymous change v1","price":2.00,"pictureFileName":"1.webp","catalogTypeId":1,"catalogBrandId":1,"availableStock":100,"restockThreshold":10,"maxStockThreshold":200,"onReorder":false}`.
2. With no `Authorization` header, `GET {catalog}/api/catalog/items/1?api-version=1.0`.

## Expected result

- Step 1 returns status `401`.
- Step 2 returns `200` with `price` `109.99` and `description` not equal to `"Anonymous change v1"`.
