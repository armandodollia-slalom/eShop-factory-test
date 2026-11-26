---
id: TC-BUG-4-12
type: sad
sad-path: auth
layer: e2e
covers: ["Expected: 401 Unauthorized for anonymous callers"]
priority: P2
---

# TC-BUG-4-12: Anonymous DELETE of a missing item returns 401, not 404

## Why

- Expected says anonymous callers get `401`, without exception. If the check ran after the item lookup, anonymous callers could probe which ids exist (`404` vs `401`). Separate from TC-BUG-4-04 because it checks ordering of authorization before the not-found branch.

## Preconditions

- Test stack up with scenario `bug-4` loaded; item 999999 does not exist.

## Steps

1. With no `Authorization` header, `DELETE {catalog}/api/catalog/items/999999?api-version=2.0`.

## Expected result

- Step 1 returns status `401`.
