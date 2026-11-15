---
id: TC-BUG-4-16
type: sad
sad-path: auth
layer: e2e
covers: ["Expected: only an admin role can change the catalog (non-admin delete refused)"]
priority: P0
---

# TC-BUG-4-16: Signed-in non-admin DELETE returns 403 and item 1 still exists

## Why

- Guards `DeleteItem` against callers outside the admin role: a customer must not be able to remove products. The follow-up read proves nothing was deleted.

## Preconditions

- Test stack up with scenario `bug-4` loaded; item 1 exists.
- Access token for `alice` (not in role `Admin`) obtained through the implicit flow of client `catalogswaggerui` (scope `catalog`, redirect URI `http://catalog-api:8080/swagger/oauth2-redirect.html`), with `getAccessToken` from `e2e/teststack/identity-token.ts`.

## Steps

1. `DELETE {catalog}/api/catalog/items/1?api-version=2.0` with header `Authorization: Bearer <alice token>`.
2. With no `Authorization` header, `GET {catalog}/api/catalog/items/1?api-version=2.0`.

## Expected result

- Step 1 returns status `403`.
- Step 2 returns `200` with `id` `1` and `name` `"Wanderer Black Hiking Boots"`.
