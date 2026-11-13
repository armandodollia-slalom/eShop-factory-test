---
id: TC-BUG-18-06
type: happy
layer: functional
covers: ["Decision: body id 0 still lets the database generate the id"]
priority: P1
---

# TC-BUG-18-06: Body id 0 is accepted and the database generates the id

## Why

- Implementation note: id 0 must keep working so existing clients are not broken; a wrong fix (rejecting id <= 0 or always requiring an id) would break them.

## Preconditions

- Catalog API running in-process on the `default` scenario (101 items with ids 1 to 101; brand 1 and type 1 exist); no authentication needed.

## Steps

1. `POST /api/catalog/items?api-version=2.0` with the body from TC-BUG-18-01 but `"id":0`.
2. `GET` the URL in the `Location` header.

## Expected result

- Step 1 returns `201 Created` with a `Location` header `/api/catalog/items/<n>` where `<n>` is greater than 0 and is not an id seeded as 1 to 101.
- Step 2 returns 200 with name "Duplicate probe" and `id` equal to `<n>`.
