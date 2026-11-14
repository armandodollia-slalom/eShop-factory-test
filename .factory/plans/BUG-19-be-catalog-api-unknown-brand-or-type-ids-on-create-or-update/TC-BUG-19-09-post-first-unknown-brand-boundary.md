---
id: TC-BUG-19-09
type: sad
sad-path: boundary
layer: functional
covers: ["Boundary: just outside the existing brand ids"]
priority: P2
---

# TC-BUG-19-09: POST with brand id 14 (one above the highest existing id) is rejected

## Why

- Just-outside boundary paired with TC-08 (13 accepted).

## Preconditions

- Catalog API in-process on the functional fixture with the `default` scenario (13 brands with ids 1-13, 8 types with ids 1-8, 101 items, item 1 exists). Anonymous caller.
- Brands have ids 1-13 only.

## Steps

1. `POST /api/catalog/items?api-version=2.0` with body `{"name":"Brand 14 Item","description":"d","price":10.0,"pictureFileName":"1.webp","catalogTypeId":1,"catalogBrandId":14,"availableStock":5,"restockThreshold":1,"maxStockThreshold":10}`.

## Expected result

- Status 400, `detail` equal to `Catalog brand with id 14 does not exist.`
