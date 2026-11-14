---
id: TC-BUG-19-02
type: sad
sad-path: validation
layer: functional
covers: ["Expected: 400 naming the unknown id", "Steps to Reproduce 1"]
priority: P1
---

# TC-BUG-19-02: POST with unknown type id 999 is rejected with 400 naming the id

## Why

- Type check is a separate branch of the validation from the brand check; a regression could fix only one. Functional layer for the real FK.

## Preconditions

- Catalog API in-process on the functional fixture with the `default` scenario (13 brands with ids 1-13, 8 types with ids 1-8, 101 items, item 1 exists). Anonymous caller.
- No catalog type with id 999.

## Steps

1. `POST /api/catalog/items?api-version=2.0` with body `{"name":"Unknown Type Item","description":"d","price":10.0,"pictureFileName":"1.webp","catalogTypeId":999,"catalogBrandId":1,"availableStock":5,"restockThreshold":1,"maxStockThreshold":10}`.
2. `GET /api/catalog/items?api-version=2.0&pageIndex=0&pageSize=200` and look for `Unknown Type Item`.

## Expected result

- Step 1: status 400, `Content-Type` `application/problem+json`, `detail` equal to `Catalog type with id 999 does not exist.`
- Step 2: no item named `Unknown Type Item`; total count is still 101.
