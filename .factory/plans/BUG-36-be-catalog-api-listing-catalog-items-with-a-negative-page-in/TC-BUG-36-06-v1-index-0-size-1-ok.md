---
id: TC-BUG-36-06
type: happy
layer: functional
covers: ["Expected: page index 0 and page size 1 behave as today", "Boundary: just inside both limits (v1)"]
priority: P1
---

# TC-BUG-36-06: v1 list with pageIndex=0 and pageSize=1 still returns the first page

## Why

- The fix must not over-reject: 0 is the smallest valid page index and 1 the smallest valid page size, the values just inside the limits. An off-by-one (`<= 0` on the index, `< 2` on the size) would turn this into a `400`. Functional layer because the response must come from the real query.

## Preconditions

- Catalog API in-process on the functional fixture with the seeded catalog (101 items). Anonymous caller.

## Steps

1. `GET /api/catalog/items?api-version=1.0&pageIndex=0&pageSize=1`.

## Expected result

- Status `200 OK`, `Content-Type` `application/json`.
- Body JSON: `pageIndex` = 0, `pageSize` = 1, `count` = 101, `data` is an array of exactly 1 item.
