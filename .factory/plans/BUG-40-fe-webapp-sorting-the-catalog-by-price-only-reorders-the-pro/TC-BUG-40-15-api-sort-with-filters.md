---
id: TC-BUG-40-15
type: happy
layer: functional
covers: ["Expected: whole catalog with the active brand filter in price order across its pages", "Expected: product count unchanged by the sort"]
priority: P1
---

# TC-BUG-40-15: API: sort with brand and type filters orders only the filtered items and keeps their count

## Why

- The sort must combine with filters: filtered first, then sorted, then paged. The count query is separate from the sorted items query, so this also proves `count` reflects the filter and not the sort. API layer because it can compare the exact ids of both pages and the count with and without `sort`.

## Preconditions

- `CatalogApiFixture` seeded with the 101 catalog items; brand id `2` is "Gravitator" (11 items), type id `3` is "Ski/boarding" (18 items). HTTP client with api-version `2.0`.

## Steps

1. Send `GET /api/catalog/items?brand=2&pageIndex=0&pageSize=9&sort=price-asc&api-version=2.0`.
2. Send `GET /api/catalog/items?brand=2&pageIndex=1&pageSize=9&sort=price-asc&api-version=2.0`.
3. Send `GET /api/catalog/items?brand=2&pageIndex=0&pageSize=9&api-version=2.0`.
4. Send `GET /api/catalog/items?type=3&pageIndex=1&pageSize=9&sort=price-desc&api-version=2.0`.

## Expected result

- Response 1: `200`, `count` = `11`, `data[*].id` exactly `[54, 14, 94, 30, 84, 2, 26, 69, 32]`.
- Response 2: `200`, `count` = `11`, `data[*].id` exactly `[42, 72]`.
- Response 3: `200`, `count` = `11` (same as with `sort`).
- Response 4: `200`, `count` = `18`, `data[*].id` exactly `[53, 5, 73, 60, 82, 39, 16, 3, 30]`.
- Every item in responses 1 and 2 has `catalogBrandId` = `2`; every item in response 4 has `catalogTypeId` = `3`.
