---
id: TC-BUG-18-05
type: sad
sad-path: conflict
layer: functional
covers: ["Expected: 409 Conflict", "Item created by the API is also an existing id"]
priority: P1
---

# TC-BUG-18-05: Creating twice with the same new id returns 201 then 409

## Why

- Proves the conflict applies to items created through the API, not only seeded ones, and that the first create is unaffected.

## Preconditions

- Catalog API running in-process on the `default` scenario (101 items with ids 1 to 101; brand 1 and type 1 exist); no authentication needed.

## Steps

1. `POST /api/catalog/items?api-version=2.0` with the body from TC-BUG-18-01 but `"id":6001`.
2. Repeat the identical request.

## Expected result

- Step 1 returns `201 Created` with `Location` ending `/api/catalog/items/6001`.
- Step 2 returns `409 Conflict`.
- `GET /api/catalog/items/6001?api-version=2.0` returns 200 with name "Duplicate probe" (exactly one item with that id).
