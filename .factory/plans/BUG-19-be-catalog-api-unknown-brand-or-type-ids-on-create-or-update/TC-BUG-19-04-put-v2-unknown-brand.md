---
id: TC-BUG-19-04
type: sad
sad-path: validation
layer: functional
covers: ["Expected: 400 naming the unknown id", "Update path brand check"]
priority: P1
---

# TC-BUG-19-04: PUT v2 on item 1 with unknown brand id 999 is rejected and changes nothing

## Why

- Update path must check the brand as well as the type; story title says brand or type on create or update.

## Preconditions

- Catalog API in-process on the functional fixture with the `default` scenario (13 brands with ids 1-13, 8 types with ids 1-8, 101 items, item 1 exists). Anonymous caller.
- Item 1 read first and recorded.

## Steps

1. `GET /api/catalog/items/1?api-version=2.0`; record the item.
2. `PUT /api/catalog/items/1?api-version=2.0` with the recorded item body but `"catalogBrandId":999`.
3. `GET /api/catalog/items/1?api-version=2.0`.

## Expected result

- Step 2: status 400, `Content-Type` `application/problem+json`, `detail` equal to `Catalog brand with id 999 does not exist.`
- Step 3: item equals the one recorded in step 1.
