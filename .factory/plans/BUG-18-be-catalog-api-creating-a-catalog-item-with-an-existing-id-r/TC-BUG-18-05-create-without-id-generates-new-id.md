---
id: TC-BUG-18-05
type: happy
layer: functional
covers: ["Expected: id absent lets database generate one"]
priority: P1
---

# TC-BUG-18-05: POST create with no id returns 201 with a database-generated id

## Why

- The duplicate check must not fire when the id is absent (0), otherwise every normal create would conflict. Regression guard on the main create path.

## Preconditions

- Catalog.API in-process via `CatalogApiFixture`, scenario `default` (101 items; item 1 exists, brand 1 and type 1 exist), anonymous.

## Steps

1. `POST /api/catalog/items?api-version=2.0` with body `{"name":"Generated id item","price":10.5,"catalogBrandId":1,"catalogTypeId":1}`.
2. `GET` the URL in the `Location` header.

## Expected result

- Step 1 returns 201 with a `Location` header `/api/catalog/items/{id}` where `{id}` is greater than 0 and is not the id of any seeded item (seeded ids are 1-101, so `{id}` is greater than 101).
- Step 2 returns 200 with name "Generated id item".
