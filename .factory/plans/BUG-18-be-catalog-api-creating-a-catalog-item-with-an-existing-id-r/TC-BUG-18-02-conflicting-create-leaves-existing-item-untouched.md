---
id: TC-BUG-18-02
type: sad
sad-path: conflict
layer: functional
covers: ["Expected: 409 Conflict (no overwrite)"]
priority: P1
---

# TC-BUG-18-02: Rejected duplicate-id create does not modify the existing item or add rows

## Why

- A 409 that still overwrote or duplicated data would be worse than the 500. Separate case so persisted state is asserted, not just the status.

## Preconditions

- Catalog.API in-process via `CatalogApiFixture`, scenario `default` (101 items; item 1 exists, brand 1 and type 1 exist), anonymous.
- Record the name, price and brand of item 1 via `GET /api/catalog/items/1?api-version=2.0`, and the `count` from `GET /api/catalog/items?api-version=2.0&pageIndex=0&pageSize=1` (101).

## Steps

1. `POST /api/catalog/items?api-version=2.0` with body `{"id":1,"name":"Duplicate item","price":999,"catalogBrandId":2,"catalogTypeId":2}`.
2. `GET /api/catalog/items/1?api-version=2.0`.
3. `GET /api/catalog/items?api-version=2.0&pageIndex=0&pageSize=1`.

## Expected result

- Step 1 returns 409.
- Step 2 returns item 1 with the same name, price and brand recorded in preconditions (not "Duplicate item", not 999).
- Step 3 reports a total count of 101.
