---
id: TC-BUG-4-08
type: happy
layer: e2e
covers: ["Expected: authorized callers can change the catalog (update)"]
priority: P0
---

# TC-BUG-4-08: Authenticated v2 PUT changes the price of item 99 (201)

## Why

- Confirms an authenticated caller can still update an item and its price through the protected `UpdateItem-V2` route on the deployed stack. Uses item 99 so the anonymous cases' assertions on item 1 are not affected.

## Preconditions

- Test stack up with scenario `default`; item 99 is "Adventurer GPS Watch", price `199.99`, type 7, brand 7.
- Access token for `alice` as in TC-BUG-4-07.

## Steps

1. `PUT {catalog}/api/catalog/items/99?api-version=2.0` with header `Authorization: Bearer <alice token>`, `Content-Type: application/json`, body `{"id":99,"name":"Adventurer GPS Watch","description":"Updated by an authenticated caller","price":189.99,"pictureFileName":"99.webp","catalogTypeId":7,"catalogBrandId":7,"availableStock":100,"restockThreshold":10,"maxStockThreshold":200,"onReorder":false}`.
2. With no `Authorization` header, `GET {catalog}/api/catalog/items/99?api-version=2.0`.

## Expected result

- Step 1 returns status `201` with header `Location: /api/catalog/items/99`.
- Step 2 returns `200` with `price` `189.99` and `description` `"Updated by an authenticated caller"`.
