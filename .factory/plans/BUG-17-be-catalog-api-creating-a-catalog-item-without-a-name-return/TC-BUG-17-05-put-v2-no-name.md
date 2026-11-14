---
id: TC-BUG-17-05
type: sad
sad-path: validation
layer: functional
covers: ["Suggested fix: shared validator for create and update"]
priority: P1
---

# TC-BUG-17-05: PUT v2 without a name returns 400 and leaves the item unchanged

## Why

- The story asks for a shared validator for create and update, so update must reject a nameless body too; v2 route has the id in the path.

## Preconditions

- Same fixture and scenario; catalog item 1 exists.

## Steps

1. `GET /api/catalog/items/1?api-version=2.0` and record `name`.
2. `PUT /api/catalog/items/1?api-version=2.0` with JSON body `{"id":1,"catalogBrandId":1,"catalogTypeId":1,"description":"No name","price":10.5,"availableStock":5,"restockThreshold":1,"maxStockThreshold":10}` (no `name`).
3. `GET /api/catalog/items/1?api-version=2.0`.

## Expected result

- Step 2 returns 400 with a non-empty ProblemDetails body.
- The `name` in step 3 equals the `name` recorded in step 1.
