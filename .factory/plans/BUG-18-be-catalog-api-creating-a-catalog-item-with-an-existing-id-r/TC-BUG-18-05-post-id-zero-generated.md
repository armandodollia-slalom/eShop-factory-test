---
id: TC-BUG-18-05
type: happy
layer: functional
covers: ["Check runs only when Id != 0 (Decisions)"]
priority: P1
---

# TC-BUG-18-05: POST with id 0 still creates an item with a server-generated id

## Why

- Id 0 means server-generated; a check without the Id != 0 guard would wrongly 409 or collide. Regression for the normal create path.

## Preconditions

- Catalog API running in-process via `CatalogApiFixture` against real Postgres, scenario `default` (101 items; item 1 is "Wanderer Black Hiking Boots"; brand id 1, type id 1); anonymous caller (the fixture's default client). 

## Steps

1. `POST /api/catalog/items?api-version=2.0` with JSON body `{"id":0,"name":"Generated id item","catalogBrandId":1,"catalogTypeId":1,"description":"Plan case","price":10.5,"availableStock":5,"restockThreshold":1,"maxStockThreshold":10}`.
2. Take the id from the end of the `Location` header and `GET /api/catalog/items/{id}?api-version=2.0`.

## Expected result

- Step 1 status is 201 and the `Location` header matches `/api/catalog/items/{id}` with an id greater than 101.
- Step 2 returns 200 with `name` `Generated id item`.
