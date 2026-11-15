---
id: TC-BUG-4-07
type: happy
layer: e2e
covers: ["Expected: only an admin role can change the catalog (admin may create)", "Acceptance Criteria 2: the rest of the file still passes"]
priority: P0
---

# TC-BUG-4-07: Admin POST creates an item (201 with Location)

## Why

- The fix must lock out anonymous and non-admin callers without locking out the admin: if JWT validation or the role claim is misconfigured on the test stack (wrong `Identity__Url`, no role claim in the token), every write would be refused and the catalog could no longer be managed. Only the test stack issues real Identity.API tokens to a deployed catalog-api, so this runs at the e2e layer.

## Preconditions

- Test stack up with scenario `bug-4` loaded (extends `default`; adds role `Admin` and user `admin` / `Pass123$` in it); item 10103 does not exist.
- Access token for `admin` obtained through the implicit flow of client `catalogswaggerui` (scope `catalog`, redirect URI `http://catalog-api:8080/swagger/oauth2-redirect.html`), with `getAccessToken` from `e2e/teststack/identity-token.ts`.

## Steps

1. `POST {catalog}/api/catalog/items?api-version=2.0` with header `Authorization: Bearer <admin token>`, `Content-Type: application/json`, body `{"id":10103,"name":"BUG-4 Admin Item","description":"Created by the catalog admin","price":25.50,"pictureFileName":null,"catalogTypeId":1,"catalogBrandId":1,"availableStock":5,"restockThreshold":1,"maxStockThreshold":10,"onReorder":false}`.
2. With no `Authorization` header, `GET {catalog}/api/catalog/items/10103?api-version=2.0`.

## Expected result

- Step 1 returns status `201` with header `Location: /api/catalog/items/10103`.
- Step 2 returns `200` with `id` `10103`, `name` `"BUG-4 Admin Item"`, `price` `25.5`.
