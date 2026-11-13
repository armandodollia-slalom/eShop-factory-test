---
id: TC-BUG-18-03
type: sad
sad-path: conflict
layer: functional
covers: ["Expected: 409 Conflict", "Actual: Postgres raises a primary key violation"]
priority: P1
---

# TC-BUG-18-03: A rejected duplicate does not modify the existing item or add a row

## Why

- A 409 is only correct if nothing was written; protects against overwriting item 1 or inserting a stray row.

## Preconditions

- Scenario default: item 1 exists; record its name, price and the total item count (101) first via `GET /api/catalog/items/1` and `GET /api/catalog/items?pageIndex=0&pageSize=1` (api-version 2.0).

## Steps

1. `POST /api/catalog/items?api-version=2.0` with `{"id": 1, "name": "Overwrite attempt", "catalogBrandId": 1, "catalogTypeId": 1, "price": 999, "availableStock": 1}`.
2. `GET /api/catalog/items/1?api-version=2.0`.
3. `GET /api/catalog/items?pageIndex=0&pageSize=1&api-version=2.0`.

## Expected result

- Step 1 returns 409.
- Step 2 returns 200 with the original name and price (not `Overwrite attempt` / 999).
- Step 3 total count equals the count recorded before.
