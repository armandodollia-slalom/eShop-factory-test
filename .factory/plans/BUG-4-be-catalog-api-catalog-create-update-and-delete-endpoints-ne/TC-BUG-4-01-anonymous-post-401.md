---
id: TC-BUG-4-01
type: sad
sad-path: auth
layer: e2e
covers: ["Steps to Reproduce 1", "Expected: 401 Unauthorized for anonymous callers", "Acceptance Criteria 1"]
priority: P0
---

# TC-BUG-4-01: Anonymous POST /api/catalog/items returns 401 and creates no item

## Why

- The bug's first reproduction step: anyone on the network could create products (`201`). This is the core security regression guard for `CreateItem`. It runs on the test stack because the AC names `e2e/teststack/catalog-admin.spec.ts` and the protection depends on the deployed JWT configuration; the functional fixture authenticates every request, so it cannot observe anonymous behavior.

## Preconditions

- Test stack up with scenario `default` loaded; catalog-api reachable at `url('catalog')`.
- Item 10101 does not exist (scenario `default` has items 1 to 101 only).

## Steps

1. With no `Authorization` header, `POST {catalog}/api/catalog/items?api-version=2.0`, `Content-Type: application/json`, body `{"id":10101,"name":"BUG-4 Anonymous Item","description":"Created without a token","price":10.00,"pictureFileName":null,"catalogTypeId":1,"catalogBrandId":1,"availableStock":5,"restockThreshold":1,"maxStockThreshold":10,"onReorder":false}`.
2. With no `Authorization` header, `GET {catalog}/api/catalog/items/10101?api-version=2.0`.

## Expected result

- Step 1 returns status `401`; there is no `Location` header.
- Step 2 returns status `404`: no item 10101 was created.
