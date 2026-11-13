---
id: TC-BUG-18-01
type: sad
sad-path: conflict
layer: functional
covers: ["Expected: 409 Conflict", "Actual: 500 on existing id"]
priority: P1
---

# TC-BUG-18-01: Creating an item whose id already exists is rejected with 409 (api-version 2.0)

## Why

- This is the reported bug: a body id of 1 reached Postgres and raised a primary key violation (500). Functional is the cheapest layer that exercises the endpoint and the real database.

## Preconditions

- Catalog API running in-process on the `default` scenario (101 items with ids 1 to 101; brand 1 and type 1 exist); no authentication needed.

## Steps

1. `POST /api/catalog/items?api-version=2.0` with JSON body `{"id":1,"name":"Duplicate probe","description":"Probe","price":9.99,"catalogBrandId":1,"catalogTypeId":1,"availableStock":5,"restockThreshold":1,"maxStockThreshold":10}`.

## Expected result

- Status `409 Conflict`; not 500 and no Postgres error surfaced.
- No `Location` header is returned.
