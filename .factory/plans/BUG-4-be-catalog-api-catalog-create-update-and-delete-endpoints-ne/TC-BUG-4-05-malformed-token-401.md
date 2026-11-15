---
id: TC-BUG-4-05
type: sad
sad-path: auth
layer: e2e
covers: ["Expected: 401 Unauthorized for callers that are not authenticated"]
priority: P1
---

# TC-BUG-4-05: POST with a malformed bearer token returns 401 and creates no item

## Why

- Requiring authentication must mean a valid token, not merely the presence of an `Authorization` header. A misconfigured JWT handler (for example a missing `Identity:Url` on the test stack) could accept or crash on a bad token. Runs on the test stack so the real JwtBearer configuration of catalog-api is exercised.

## Preconditions

- Test stack up with scenario `bug-4` loaded; item 10102 does not exist.

## Steps

1. `POST {catalog}/api/catalog/items?api-version=2.0` with header `Authorization: Bearer not-a-valid-token`, `Content-Type: application/json`, body `{"id":10102,"name":"BUG-4 Bad Token Item","description":"Created with a malformed token","price":10.00,"pictureFileName":null,"catalogTypeId":1,"catalogBrandId":1,"availableStock":5,"restockThreshold":1,"maxStockThreshold":10,"onReorder":false}`.
2. With no `Authorization` header, `GET {catalog}/api/catalog/items/10102?api-version=2.0`.

## Expected result

- Step 1 returns status `401`.
- Step 2 returns status `404`.
