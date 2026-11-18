---
id: TC-BUG-40-14
type: happy
layer: functional
covers: ["Expected: Name: A to Z stays as it is today", "Implementation Notes: name-asc is the default; the default sort sends no sort parameter"]
priority: P1
---

# TC-BUG-40-14: API: no sort and name-asc return today's default order

## Why

- The WebApp sends no `sort` for "Name: A to Z", and every other caller of v2 `/items` sends none either, so the parameterless order must stay exactly as before; `sort=name-asc` must mean the same thing. Duplicate names (items 17 and 74, both "Apex Climbing Harness") check the Id tie-break that keeps paging stable.

## Preconditions

- `CatalogApiFixture` seeded with the 101 catalog items. HTTP client with api-version `2.0`.

## Steps

1. Send `GET /api/catalog/items?pageIndex=0&pageSize=9&api-version=2.0`.
2. Send `GET /api/catalog/items?pageIndex=0&pageSize=9&sort=name-asc&api-version=2.0`.

## Expected result

- Both responses are `200` with `count` = `101`.
- Response 1 `data[*].id` is exactly `[99, 95, 88, 3, 28, 18, 17, 74, 49]` (Adventurer GPS Watch first; item 17 before item 74).
- Response 2 `data[*].id` is exactly the same list in the same order.
