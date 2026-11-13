---
id: TC-BUG-17-05
type: sad
sad-path: validation
layer: functional
covers: ["Decisions: rejected before any database access"]
priority: P1
---

# TC-BUG-17-05: Rejected create does not add a catalog row

## Why

- Validation must run before saving; a regression that saved then failed would leave state behind or still raise 500.

## Preconditions

- Catalog.API in-process via `CatalogApiFixture`, scenario `default` (101 items; brand 1, type 1 and item 1 exist), anonymous.

## Steps

1. `GET /api/catalog/items?pageIndex=0&pageSize=1&api-version=2.0` and record `count` (101 in `default`).
2. `POST /api/catalog/items?api-version=2.0` with JSON body `{"description":"Test item","price":10.5,"catalogBrandId":1,"catalogTypeId":1}` (no name).
3. Repeat the GET of step 1.

## Expected result

- Step 2 returns 400.
- `count` in step 3 equals the value recorded in step 1.
