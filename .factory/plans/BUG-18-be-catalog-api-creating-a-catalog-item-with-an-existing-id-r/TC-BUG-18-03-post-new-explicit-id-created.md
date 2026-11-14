---
id: TC-BUG-18-03
type: happy
layer: functional
covers: ["Honoring a client id that is not taken (Decisions)"]
priority: P1
---

# TC-BUG-18-03: POST with an unused explicit id returns 201 and keeps that id

## Why

- The decision was to keep honoring client ids; the duplicate check must not reject ids that are free.

## Preconditions

- Catalog API running in-process via `CatalogApiFixture` against real Postgres, scenario `default` (101 items; item 1 is "Wanderer Black Hiking Boots"; brand id 1, type id 1); anonymous caller (the fixture's default client). No item with id 5000 exists (the default scenario has ids 1-101).

## Steps

1. `POST /api/catalog/items?api-version=2.0` with JSON body `{"id":5000,"name":"Explicit id item","catalogBrandId":1,"catalogTypeId":1,"description":"Plan case","price":10.5,"availableStock":5,"restockThreshold":1,"maxStockThreshold":10}`.
2. `GET /api/catalog/items/5000?api-version=2.0`.

## Expected result

- Step 1 status is 201 and the `Location` header ends with `/api/catalog/items/5000`.
- Step 2 returns 200 with `id` 5000 and `name` `Explicit id item`.
