---
id: TC-BUG-18-03
type: sad
sad-path: conflict
layer: functional
covers: ["Expected: 409 Conflict", "Existing item is not overwritten"]
priority: P1
---

# TC-BUG-18-03: A rejected duplicate-id request leaves the existing item and the catalog unchanged

## Why

- The risk of a fix is silently overwriting or adding rows; this proves the 409 saves nothing. It is separate from the status cases because it asserts persisted state.

## Preconditions

- Catalog API running in-process on the `default` scenario (101 items with ids 1 to 101; brand 1 and type 1 exist); no authentication needed.

## Steps

1. `GET /api/catalog/items/1?api-version=2.0`; record `name`, `price`, `description` and the total `count` from `GET /api/catalog/items?api-version=2.0&pageIndex=0&pageSize=1`.
2. `POST /api/catalog/items?api-version=2.0` with body `{"id":1,"name":"Overwrite attempt","description":"Overwrite","price":1.23,"catalogBrandId":1,"catalogTypeId":1,"availableStock":5,"restockThreshold":1,"maxStockThreshold":10}`.
3. Repeat the two GETs from step 1.

## Expected result

- Step 2 returns `409 Conflict`.
- After step 3, item 1 has the same `name`, `price` and `description` as recorded (not "Overwrite attempt", not 1.23) and `count` is unchanged (101).
