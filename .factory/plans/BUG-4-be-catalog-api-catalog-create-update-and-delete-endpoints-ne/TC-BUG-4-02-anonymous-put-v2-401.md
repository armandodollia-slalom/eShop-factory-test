---
id: TC-BUG-4-02
type: sad
sad-path: auth
layer: e2e
covers: ["Steps to Reproduce 2 (PUT)", "Expected: 401 Unauthorized for anonymous callers", "Acceptance Criteria 1"]
priority: P0
---

# TC-BUG-4-02: Anonymous v2 PUT /api/catalog/items/1 returns 401 and leaves item 1 unchanged

## Why

- The bug's second step: anyone could change products and prices (`201`). Guards `UpdateItem-V2`. Checking that the stored price is unchanged proves the request was rejected before any write, not after. Test stack layer for the same reason as TC-BUG-4-01.

## Preconditions

- Test stack up with scenario `default`; item 1 is "Wanderer Black Hiking Boots", price `109.99`, type 1, brand 1.

## Steps

1. With no `Authorization` header, `PUT {catalog}/api/catalog/items/1?api-version=2.0`, `Content-Type: application/json`, body `{"id":1,"name":"Wanderer Black Hiking Boots","description":"Anonymous change","price":1.00,"pictureFileName":"1.webp","catalogTypeId":1,"catalogBrandId":1,"availableStock":100,"restockThreshold":10,"maxStockThreshold":200,"onReorder":false}`.
2. With no `Authorization` header, `GET {catalog}/api/catalog/items/1?api-version=2.0`.

## Expected result

- Step 1 returns status `401`.
- Step 2 returns `200` with `price` `109.99` and `description` not equal to `"Anonymous change"`.
