---
id: TC-BUG-36-07
type: happy
layer: functional
covers: ["Expected: page index 0 and page size 1 behave as today", "Boundary: just inside both limits (v2)"]
priority: P1
---

# TC-BUG-36-07: v2 list with pageIndex=0 and pageSize=1 still returns the first page

## Why

- Same lower-boundary check as case 06 on the v2 endpoint, which has its own route registration and could be given a different (wrong) rule. Functional layer because the response must come from the real query.

## Preconditions

- Catalog API in-process on the functional fixture with the seeded catalog (101 items). Anonymous caller.

## Steps

1. `GET /api/catalog/items?api-version=2.0&pageIndex=0&pageSize=1` (no filters).

## Expected result

- Status `200 OK`, `Content-Type` `application/json`.
- Body JSON: `pageIndex` = 0, `pageSize` = 1, `count` = 101, `data` is an array of exactly 1 item.
