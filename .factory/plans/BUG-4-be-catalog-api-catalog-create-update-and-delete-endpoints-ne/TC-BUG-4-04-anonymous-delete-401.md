---
id: TC-BUG-4-04
type: sad
sad-path: auth
layer: e2e
covers: ["Steps to Reproduce 2 (DELETE)", "Expected: 401 Unauthorized for anonymous callers", "Acceptance Criteria 1"]
priority: P0
---

# TC-BUG-4-04: Anonymous DELETE /api/catalog/items/1 returns 401 and item 1 still exists

## Why

- The bug's DELETE step returned `204`: anyone could remove products. Guards `DeleteItem`; the follow-up read proves nothing was deleted. Test stack layer for the same reason as TC-BUG-4-01.

## Preconditions

- Test stack up with scenario `bug-4` loaded; item 1 exists.

## Steps

1. With no `Authorization` header, `DELETE {catalog}/api/catalog/items/1?api-version=2.0`.
2. With no `Authorization` header, `GET {catalog}/api/catalog/items/1?api-version=2.0`.

## Expected result

- Step 1 returns status `401`.
- Step 2 returns `200` with `id` `1` and `name` `"Wanderer Black Hiking Boots"`.
