---
id: TC-BUG-17-03
type: sad
sad-path: validation
layer: functional
covers: ["Expected: validation problem instead of failed save", "Suggested fix: validate before saving"]
priority: P2
---

# TC-BUG-17-03: Rejected nameless POST stores no item

## Why

- The fix validates before saving; the risk is a half-created row or a changed catalog. Separate from the status check so each fails independently.

## Preconditions

- Catalog API running in-process via `CatalogApiFixture` against real Postgres, scenario `default` (101 items, brand id 1, type id 1); anonymous caller (the fixture's default client).

## Steps

1. `GET /api/catalog/items?api-version=2.0&pageIndex=0&pageSize=1` and record `count` from the body (101 on a fresh default scenario).
2. `POST /api/catalog/items?api-version=2.0` with the body from TC-BUG-17-01.
3. `GET /api/catalog/items?api-version=2.0&pageIndex=0&pageSize=1` again.

## Expected result

- Step 2 returns 400.
- `count` in step 3 equals `count` recorded in step 1.
