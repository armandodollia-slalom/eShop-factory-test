---
id: TC-BUG-17-08
type: sad
sad-path: validation
layer: functional
covers: ["Decisions: shared validator for create and update", "Code map: PUT v1 /items"]
priority: P1
---

# TC-BUG-17-08: PUT v1 update with no name returns 400 and leaves the item unchanged

## Why

- v1 update reaches the same validation through `UpdateItemV1`; a separate case proves that route.

## Preconditions

- Catalog.API in-process via `CatalogApiFixture`, scenario `default` (101 items; brand 1, type 1 and item 1 exist), anonymous.

## Steps

1. `GET /api/catalog/items/1?api-version=1.0`; keep the body and the original `name`.
2. `PUT /api/catalog/items?api-version=1.0` with the body from step 1 without the `name` property.
3. `GET /api/catalog/items/1?api-version=1.0`.

## Expected result

- Step 2 returns 400 with a ProblemDetails body with non-empty `detail`.
- Step 3 returns 200 and `name` equals the original name.
