---
id: TC-BUG-4-13
type: sad
sad-path: auth
layer: e2e
covers: ["Expected: only an admin role can change the catalog (non-admin create refused)", "Code map: 401/403 on the write operations"]
priority: P0
---

# TC-BUG-4-13: Signed-in non-admin POST returns 403 and creates no item

## Why

- Expected limits catalog changes to an admin role, so a signed-in customer must be refused too, not only anonymous callers. Without this case a fix that only requires authentication (any customer may change prices) would pass every other case. The token carries the `catalog` scope so the refusal can only come from the missing admin role. Runs on the test stack because the role claim comes from the real Identity.API token.

## Preconditions

- Test stack up with scenario `bug-4` loaded; item 10104 does not exist.
- Access token for `alice` (not in role `Admin`) obtained through the implicit flow of client `catalogswaggerui` (scope `catalog`, redirect URI `http://catalog-api:8080/swagger/oauth2-redirect.html`), with `getAccessToken` from `e2e/teststack/identity-token.ts`.

## Steps

1. `POST {catalog}/api/catalog/items?api-version=2.0` with header `Authorization: Bearer <alice token>`, `Content-Type: application/json`, body `{"id":10104,"name":"BUG-4 Customer Item","description":"Created by a non-admin","price":10.00,"pictureFileName":null,"catalogTypeId":1,"catalogBrandId":1,"availableStock":5,"restockThreshold":1,"maxStockThreshold":10,"onReorder":false}`.
2. With no `Authorization` header, `GET {catalog}/api/catalog/items/10104?api-version=2.0`.

## Expected result

- Step 1 returns status `403`; there is no `Location` header.
- Step 2 returns status `404`: no item 10104 was created.
