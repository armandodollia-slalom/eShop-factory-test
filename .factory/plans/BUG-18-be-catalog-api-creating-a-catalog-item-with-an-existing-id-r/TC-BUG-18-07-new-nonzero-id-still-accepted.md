---
id: TC-BUG-18-07
type: happy
layer: functional
covers: ["Decision: a new non-zero id that does not exist yet is still accepted"]
priority: P1
---

# TC-BUG-18-07: A non-zero id that does not exist yet is still accepted and used

## Why

- Implementation note: ignoring the client id would change existing behavior; this guards that a not-yet-used id is kept.

## Preconditions

- Catalog API running in-process on the `default` scenario (101 items with ids 1 to 101; brand 1 and type 1 exist); no authentication needed.

## Steps

1. `POST /api/catalog/items?api-version=2.0` with the body from TC-BUG-18-01 but `"id":6002`.
2. `GET /api/catalog/items/6002?api-version=2.0`.

## Expected result

- Step 1 returns `201 Created` with `Location` ending `/api/catalog/items/6002`.
- Step 2 returns 200 with `id` 6002 and name "Duplicate probe".
