---
id: TC-BUG-17-06
type: sad
sad-path: validation
layer: functional
covers: ["Suggested fix: shared validator for create and update"]
priority: P2
---

# TC-BUG-17-06: PUT v1 without a name returns 400

## Why

- v1 PUT is a separate route (body carries the id) that delegates to the same update logic; proves the validation applies on both versions.

## Preconditions

- Same fixture and scenario; catalog item 1 exists.

## Steps

1. `PUT /api/catalog/items?api-version=1.0` with JSON body `{"id":1,"catalogBrandId":1,"catalogTypeId":1,"description":"No name","price":10.5,"availableStock":5,"restockThreshold":1,"maxStockThreshold":10}` (no `name`).

## Expected result

- Status is 400.
- The response body is non-empty and is a ProblemDetails JSON (it has a `detail` property).
