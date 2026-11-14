---
id: TC-BUG-19-01
type: sad
sad-path: validation
layer: functional
covers: ["Expected: 400 naming the unknown id", "Steps to Reproduce 1"]
priority: P1
---

# TC-BUG-19-01: POST with unknown brand id 999 is rejected with 400 naming the id

## Why

- Reproduces step 1 of the bug (was a 500 from a Postgres FK violation). Functional layer because the real database is needed to prove the FK error no longer surfaces.

## Preconditions

- Catalog API in-process on the functional fixture with the `default` scenario (13 brands with ids 1-13, 8 types with ids 1-8, 101 items, item 1 exists). Anonymous caller.
- No catalog brand with id 999.

## Steps

1. `POST /api/catalog/items?api-version=2.0` with body `{"name":"Unknown Brand Item","description":"d","price":10.0,"pictureFileName":"1.webp","catalogTypeId":1,"catalogBrandId":999,"availableStock":5,"restockThreshold":1,"maxStockThreshold":10}`.
2. `GET /api/catalog/items?api-version=2.0&pageIndex=0&pageSize=200` and look for an item named `Unknown Brand Item`.

## Expected result

- Step 1: status 400, `Content-Type` `application/problem+json`, `status` 400, `detail` equal to `Catalog brand with id 999 does not exist.`
- Step 2: no item named `Unknown Brand Item`; total count is still 101.
