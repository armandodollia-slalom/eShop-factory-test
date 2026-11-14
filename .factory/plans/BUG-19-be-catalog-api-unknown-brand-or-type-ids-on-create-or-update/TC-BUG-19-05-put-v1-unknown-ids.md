---
id: TC-BUG-19-05
type: sad
sad-path: validation
layer: functional
covers: ["Expected: 400 naming the unknown id", "PUT v1 path"]
priority: P2
---

# TC-BUG-19-05: PUT v1 with an unknown brand id or an unknown type id is rejected with 400

## Why

- v1 PUT takes the id from the body and delegates to the shared update; one case proves the v1 route is also guarded (brand 999 only; type check is shared code covered by TC-03).

## Preconditions

- Catalog API in-process on the functional fixture with the `default` scenario (13 brands with ids 1-13, 8 types with ids 1-8, 101 items, item 1 exists). Anonymous caller.
- Item 1 read first and recorded.

## Steps

1. `GET /api/catalog/items/1?api-version=1.0`; record the item.
2. `PUT /api/catalog/items?api-version=1.0` with the recorded item body (including `"id":1`) but `"catalogBrandId":999`.
3. `GET /api/catalog/items/1?api-version=1.0`.

## Expected result

- Step 2: status 400, `Content-Type` `application/problem+json`, `detail` equal to `Catalog brand with id 999 does not exist.`
- Step 3: item equals the one recorded in step 1.
