---
id: TC-RANGE-1-03
type: happy
layer: functional
covers: ["AC6: range for the type filter", "AC2: type Navigation $59.99 – $299.00"]
priority: P1
---

# TC-RANGE-1-03: Facets for type Navigation return 59.99 and 299.00

## Why

- AC6 requires the range to follow the `type` filter, a separate code path from the brand filter (the endpoint scopes brand and type independently for the badge counts). If the type filter were dropped from the price selection, the result would be the whole catalog's range.

## Preconditions

- `default` scenario. Type Navigation has id 7 and 11 items priced from $59.99 to $299.00.

## Steps

1. Anonymous `GET /api/catalog/items/facets?api-version=1.0&type=7`.

## Expected result

- Status 200.
- `minPrice` is `59.99` and `maxPrice` is `299.00`.
