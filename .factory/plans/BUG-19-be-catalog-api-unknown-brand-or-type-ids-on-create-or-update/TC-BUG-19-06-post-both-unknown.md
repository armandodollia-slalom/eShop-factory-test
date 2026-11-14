---
id: TC-BUG-19-06
type: sad
sad-path: validation
layer: functional
covers: ["Decision: brand checked before type, first unknown id reported"]
priority: P2
---

# TC-BUG-19-06: POST with both brand and type unknown reports the brand only

## Why

- Implementation notes fix the order (brand first, one error). Guards against the message changing order or listing both.

## Preconditions

- Catalog API in-process on the functional fixture with the `default` scenario (13 brands with ids 1-13, 8 types with ids 1-8, 101 items, item 1 exists). Anonymous caller.
- No brand 999 and no type 998.

## Steps

1. `POST /api/catalog/items?api-version=2.0` with body `{"name":"Both Unknown","description":"d","price":10.0,"pictureFileName":"1.webp","catalogTypeId":998,"catalogBrandId":999,"availableStock":5,"restockThreshold":1,"maxStockThreshold":10}`.

## Expected result

- Status 400, `detail` equal to `Catalog brand with id 999 does not exist.`; the `detail` does not contain `998`.
