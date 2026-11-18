---
id: TC-RANGE-1-17
type: happy
layer: functional
covers: ["AC6: optional repeated type parameter"]
priority: P2
---

# TC-RANGE-1-17: Repeated type parameters return the range of the union of those types

## Why

- AC6 states `type` may be repeated, and TC-RANGE-1-05 only exercises repeated `brand`; the type filter is bound separately, so it needs its own case. Climbing and Navigation are chosen so the lowest price comes from one type and the highest from the other: a range built from only the first type (Climbing, $21.99 – $189.99) or only the last (Navigation, $59.99 – $299.00) fails, and the union's maximum ($299.00) differs from the unfiltered $699.00, so an ignored filter fails too. Functional is the cheapest layer that reaches the real query against the seeded catalog.

## Preconditions

- `default` scenario. Climbing (type 2): 14 items, $21.99 (item 31, Legend) – $189.99. Navigation (type 7): 11 items, $59.99 – $299.00 (item 69, Gravitator).

## Steps

1. Anonymous `GET /api/catalog/items/facets?api-version=1.0&type=2&type=7`.

## Expected result

- Status 200.
- `minPrice` is `21.99` (a Climbing item) and `maxPrice` is `299.00` (a Navigation item).
