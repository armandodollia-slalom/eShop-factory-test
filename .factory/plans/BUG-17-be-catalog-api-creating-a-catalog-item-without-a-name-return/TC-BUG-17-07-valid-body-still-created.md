---
id: TC-BUG-17-07
type: happy
layer: functional
covers: ["Implementation Notes: valid body unchanged 201 with Location"]
priority: P1
---

# TC-BUG-17-07: Valid body still returns 201 with Location and persists the item

## Why

- Guards against the new validation rejecting valid requests; checks the unchanged success contract including persistence.

## Preconditions

- Catalog API running in-process on the `default` scenario (101 items, brand 1 and type 1 exist); no authentication needed.

## Steps

1. `POST /api/catalog/items?api-version=2.0` with body `{"id":0,"name":"BUG17 Valid Item","description":"Valid","price":12.5,"catalogBrandId":1,"catalogTypeId":1,"availableStock":3,"restockThreshold":1,"maxStockThreshold":10}` (use an unused id as the existing create tests do).
2. `GET` the URL from the `Location` header with `api-version=2.0`.

## Expected result

- Step 1 returns `201 Created` with `Location` equal to `/api/catalog/items/{id}`.
- Step 2 returns 200 and the item has `name` `BUG17 Valid Item` and `price` 12.5.
