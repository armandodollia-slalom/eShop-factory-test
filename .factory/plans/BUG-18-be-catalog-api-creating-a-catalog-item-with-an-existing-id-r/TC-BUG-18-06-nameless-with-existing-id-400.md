---
id: TC-BUG-18-06
type: sad
sad-path: validation
layer: functional
covers: ["Decisions: check runs after required-name validation"]
priority: P2
---

# TC-BUG-18-06: POST without a name and with an existing id returns 400, not 409

## Why

- The story states name validation runs first; this pins the ordering between the two rejections.

## Preconditions

- Catalog API running in-process via `CatalogApiFixture` against real Postgres, scenario `default` (101 items; item 1 is "Wanderer Black Hiking Boots"; brand id 1, type id 1); anonymous caller (the fixture's default client). 

## Steps

1. `POST /api/catalog/items?api-version=2.0` with JSON body `{"id":1,"catalogBrandId":1,"catalogTypeId":1,"description":"No name","price":10.5,"availableStock":5,"restockThreshold":1,"maxStockThreshold":10}` (no `name`).

## Expected result

- Status is 400 (not 409, not 500).
- The response body is non-empty ProblemDetails JSON.
