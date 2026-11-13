---
id: TC-BUG-18-04
type: happy
layer: functional
covers: ["Expected: id is generated", "Decisions: id 0 lets the database generate the id"]
priority: P1
---

# TC-BUG-18-04: POST with id 0 still creates the item with a generated id

## Why

- Guards against the existence check wrongly rejecting id 0, which the Decisions say must keep generating ids.

## Preconditions

- Scenario default; no item has id 0.

## Steps

1. `POST /api/catalog/items?api-version=2.0` with `{"id": 0, "name": "Generated Id Item", "catalogBrandId": 1, "catalogTypeId": 1, "price": 10, "availableStock": 1}`.
2. `GET` the URL from the `Location` header.

## Expected result

- Step 1 returns 201 with a `Location` header `/api/catalog/items/<n>` where `<n>` > 0 and was not an existing id.
- Step 2 returns 200 with name `Generated Id Item` and id `<n>`.
