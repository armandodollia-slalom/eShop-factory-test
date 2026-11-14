---
id: TC-BUG-4-09
type: happy
layer: e2e
covers: ["Expected: authorized callers can change the catalog (delete)"]
priority: P0
---

# TC-BUG-4-09: Authenticated DELETE removes item 101 (204, then 404)

## Why

- Confirms the protected `DeleteItem` route still works for an authenticated caller on the deployed stack. Item 101 is used so no other case depends on it.

## Preconditions

- Test stack up with scenario `default`; item 101 exists.
- Access token for `alice` as in TC-BUG-4-07.

## Steps

1. `DELETE {catalog}/api/catalog/items/101?api-version=2.0` with header `Authorization: Bearer <alice token>`.
2. With no `Authorization` header, `GET {catalog}/api/catalog/items/101?api-version=2.0`.

## Expected result

- Step 1 returns status `204`.
- Step 2 returns status `404`.
