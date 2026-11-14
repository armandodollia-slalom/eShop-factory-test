---
id: TC-BUG-19-10
type: happy
layer: functional
covers: ["Happy path unchanged on update"]
priority: P1
---

# TC-BUG-19-10: PUT v2 on item 1 with existing brand 2 and type 3 still updates the item

## Why

- Regression guard that the new validation does not break the valid update path.

## Preconditions

- Catalog API in-process on the functional fixture with the `default` scenario (13 brands with ids 1-13, 8 types with ids 1-8, 101 items, item 1 exists). Anonymous caller.

## Steps

1. `GET /api/catalog/items/1?api-version=2.0`; record the item.
2. `PUT /api/catalog/items/1?api-version=2.0` with the recorded item body but `"name":"Valid Update"`, `"catalogBrandId":2`, `"catalogTypeId":3`.
3. `GET /api/catalog/items/1?api-version=2.0`.

## Expected result

- Step 2: status 201.
- Step 3: `name` is `Valid Update`, `catalogBrand.id` is 2, `catalogType.id` is 3.
