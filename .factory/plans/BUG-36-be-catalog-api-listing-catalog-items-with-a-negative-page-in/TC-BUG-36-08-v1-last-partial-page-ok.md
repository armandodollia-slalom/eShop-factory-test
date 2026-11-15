---
id: TC-BUG-36-08
type: happy
layer: functional
covers: ["Expected: requests with a page index of 0 or more and a page size of 1 or more behave as today"]
priority: P2
---

# TC-BUG-36-08: v1 list with pageIndex=10 and pageSize=10 returns the last partial page

## Why

- Checks that ordinary paging past the first page is unchanged: with 101 items and page size 10, index 10 is the last page holding one item. Guards against a validation rule that caps or rewrites positive values. Functional layer because skip/take runs in the real database.

## Preconditions

- Catalog API in-process on the functional fixture with the seeded catalog (101 items). Anonymous caller.

## Steps

1. `GET /api/catalog/items?api-version=1.0&pageIndex=10&pageSize=10`.

## Expected result

- Status `200 OK`, `Content-Type` `application/json`.
- Body JSON: `pageIndex` = 10, `pageSize` = 10, `count` = 101, `data` is an array of exactly 1 item.
