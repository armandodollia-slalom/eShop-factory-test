---
id: TC-BUG-19-07
type: sad
sad-path: not-found
layer: functional
covers: ["Update path: 404 before reference check"]
priority: P2
---

# TC-BUG-19-07: PUT v2 on a missing item with an unknown brand id returns 404, not 400

## Why

- Notes state the check runs after the 404 lookup; this protects the existing not-found contract from being masked by the new validation.

## Preconditions

- Catalog API in-process on the functional fixture with the `default` scenario (13 brands with ids 1-13, 8 types with ids 1-8, 101 items, item 1 exists). Anonymous caller.
- No item with id 99999.

## Steps

1. `PUT /api/catalog/items/99999?api-version=2.0` with body `{"id":99999,"name":"Ghost","description":"d","price":10.0,"pictureFileName":"1.webp","catalogTypeId":1,"catalogBrandId":999,"availableStock":5,"restockThreshold":1,"maxStockThreshold":10}`.

## Expected result

- Status 404; `detail` equal to `Item with id 99999 not found.`
