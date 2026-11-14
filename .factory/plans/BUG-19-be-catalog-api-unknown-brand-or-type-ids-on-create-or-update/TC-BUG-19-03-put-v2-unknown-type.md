---
id: TC-BUG-19-03
type: sad
sad-path: validation
layer: functional
covers: ["Expected: 400 naming the unknown id", "Steps to Reproduce 2"]
priority: P1
---

# TC-BUG-19-03: PUT v2 on item 1 with unknown type id 999 is rejected and changes nothing

## Why

- Reproduces step 2 of the bug. The body also changes name and price to prove nothing is saved and no price-changed event path runs after a rejection.

## Preconditions

- Catalog API in-process on the functional fixture with the `default` scenario (13 brands with ids 1-13, 8 types with ids 1-8, 101 items, item 1 exists). Anonymous caller.
- Item 1 read first with `GET /api/catalog/items/1?api-version=2.0` and its name, price, brand id and type id recorded.

## Steps

1. `GET /api/catalog/items/1?api-version=2.0`; record the item.
2. `PUT /api/catalog/items/1?api-version=2.0` with the recorded item body but `"name":"Changed Name"`, `"price":` recorded price plus 1, `"catalogTypeId":999`.
3. `GET /api/catalog/items/1?api-version=2.0`.

## Expected result

- Step 2: status 400, `Content-Type` `application/problem+json`, `detail` equal to `Catalog type with id 999 does not exist.`
- Step 3: name, price, brand id and type id equal the values recorded in step 1.
