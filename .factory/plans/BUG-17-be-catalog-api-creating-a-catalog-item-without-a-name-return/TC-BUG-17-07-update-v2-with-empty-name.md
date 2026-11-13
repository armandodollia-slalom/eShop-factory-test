---
id: TC-BUG-17-07
type: sad
sad-path: validation
layer: functional
covers: ["Decisions: shared validator for create and update", "Code map: PUT v2 /items/{id}"]
priority: P1
---

# TC-BUG-17-07: PUT v2 update with blank name returns 400 and leaves the item unchanged

## Why

- The story's suggested fix is a shared validator for create and update; v2 update must reject a blank name.

## Preconditions

- Catalog.API in-process via `CatalogApiFixture`, scenario `default` (101 items; brand 1, type 1 and item 1 exist), anonymous.

## Steps

1. `GET /api/catalog/items/1?api-version=2.0`; keep the body and the original `name`.
2. `PUT /api/catalog/items/1?api-version=2.0` with the body from step 1 where `name` is `""`.
3. `GET /api/catalog/items/1?api-version=2.0`.

## Expected result

- Step 2 returns 400 with a ProblemDetails body with non-empty `detail`.
- Step 3 returns 200 and `name` equals the original name.
