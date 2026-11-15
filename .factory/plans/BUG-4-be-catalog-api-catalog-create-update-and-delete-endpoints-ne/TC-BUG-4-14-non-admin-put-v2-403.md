---
id: TC-BUG-4-14
type: sad
sad-path: auth
layer: e2e
covers: ["Expected: only an admin role can change the catalog (non-admin update refused)", "Actual: anyone can change prices"]
priority: P0
---

# TC-BUG-4-14: Signed-in non-admin v2 PUT returns 403 and leaves item 1 unchanged

## Why

- A customer changing a price is the most damaging form of the bug (it also publishes `ProductPriceChangedIntegrationEvent` to baskets). Guards `UpdateItem-V2` against callers outside the admin role; the follow-up read proves nothing was written.

## Preconditions

- Test stack up with scenario `bug-4` loaded; item 1 is "Wanderer Black Hiking Boots", price `109.99`.
- Access token for `alice` (not in role `Admin`) obtained through the implicit flow of client `catalogswaggerui` (scope `catalog`, redirect URI `http://catalog-api:8080/swagger/oauth2-redirect.html`), with `getAccessToken` from `e2e/teststack/identity-token.ts`.

## Steps

1. `PUT {catalog}/api/catalog/items/1?api-version=2.0` with header `Authorization: Bearer <alice token>`, `Content-Type: application/json`, body `{"id":1,"name":"Wanderer Black Hiking Boots","description":"Customer change","price":1.00,"pictureFileName":"1.webp","catalogTypeId":1,"catalogBrandId":1,"availableStock":100,"restockThreshold":10,"maxStockThreshold":200,"onReorder":false}`.
2. With no `Authorization` header, `GET {catalog}/api/catalog/items/1?api-version=2.0`.

## Expected result

- Step 1 returns status `403`.
- Step 2 returns `200` with `price` `109.99` and `description` not equal to `"Customer change"`.
