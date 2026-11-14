---
id: TC-BUG-4-07
type: happy
layer: e2e
covers: ["Expected: authorized callers can change the catalog (create)", "Acceptance Criteria 2: the rest of the file still passes"]
priority: P0
---

# TC-BUG-4-07: Authenticated POST creates an item (201 with Location)

## Why

- The fix must lock out anonymous callers without locking out legitimate ones: if JWT validation is misconfigured (wrong `Identity__Url` / issuer on the test stack), every write would return `401` and the catalog could no longer be managed. Only the test stack issues real Identity.API tokens to a deployed catalog-api.

## Preconditions

- Test stack up with scenario `default`; item 10103 does not exist.
- Access token for `alice` obtained via the implicit flow of client `orderingswaggerui` (scope `orders`), as in `e2e/teststack/bug-15.spec.ts`.

## Steps

1. `POST {catalog}/api/catalog/items?api-version=2.0` with header `Authorization: Bearer <alice token>`, `Content-Type: application/json`, body `{"id":10103,"name":"BUG-4 Admin Item","description":"Created by an authenticated caller","price":25.50,"pictureFileName":null,"catalogTypeId":1,"catalogBrandId":1,"availableStock":5,"restockThreshold":1,"maxStockThreshold":10,"onReorder":false}`.
2. With no `Authorization` header, `GET {catalog}/api/catalog/items/10103?api-version=2.0`.

## Expected result

- Step 1 returns status `201` with header `Location: /api/catalog/items/10103`.
- Step 2 returns `200` with `id` `10103`, `name` `"BUG-4 Admin Item"`, `price` `25.5`.
