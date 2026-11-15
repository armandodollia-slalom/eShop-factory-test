---
id: TC-BUG-4-15
type: sad
sad-path: auth
layer: e2e
covers: ["Expected: only an admin role can change the catalog (non-admin v1 update refused)", "Technical Notes: UpdateItemV1 mapped separately"]
priority: P1
---

# TC-BUG-4-15: Signed-in non-admin v1 PUT returns 403 and leaves item 1 unchanged

## Why

- `UpdateItemV1` (`PUT /api/catalog/items`, id in the body) is a separate mapping from the v2 PUT (Technical Notes); a role policy applied to one route only would leave the other open to customers.

## Preconditions

- Test stack up with scenario `bug-4` loaded; item 1 has price `109.99`.
- Access token for `alice` (not in role `Admin`) obtained through the implicit flow of client `catalogswaggerui` (scope `catalog`, redirect URI `http://catalog-api:8080/swagger/oauth2-redirect.html`), with `getAccessToken` from `e2e/teststack/identity-token.ts`.

## Steps

1. `PUT {catalog}/api/catalog/items?api-version=1.0` with header `Authorization: Bearer <alice token>`, `Content-Type: application/json`, body `{"id":1,"name":"Wanderer Black Hiking Boots","description":"Customer change v1","price":2.00,"pictureFileName":"1.webp","catalogTypeId":1,"catalogBrandId":1,"availableStock":100,"restockThreshold":10,"maxStockThreshold":200,"onReorder":false}`.
2. With no `Authorization` header, `GET {catalog}/api/catalog/items/1?api-version=1.0`.

## Expected result

- Step 1 returns status `403`.
- Step 2 returns `200` with `price` `109.99` and `description` not equal to `"Customer change v1"`.
