---
id: TC-BUG-40-16
type: sad
sad-path: validation
layer: functional
covers: ["Implementation Notes: unknown sort values fall back to the default without error"]
priority: P3
---

# TC-BUG-40-16: API: an unknown sort value falls back to the default order

## Why

- The `sort` value comes from a user-editable URL. The Implementation Notes state that an unknown value uses the default order without an error, so a hand-edited or stale link must still show the catalog instead of failing. Functional, because the fallback is in the API's sort switch.

## Preconditions

- `CatalogApiFixture` seeded with the 101 catalog items. HTTP client with api-version `2.0`.

## Steps

1. Send `GET /api/catalog/items?pageIndex=0&pageSize=9&sort=cheapest&api-version=2.0`.

## Expected result

- Status `200` (not `400`).
- `count` = `101`.
- `data[*].id` is exactly `[99, 95, 88, 3, 28, 18, 17, 74, 49]` (the default name-asc order from TC-BUG-40-14).
