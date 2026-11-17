---
id: TC-RANGE-1-05
type: happy
layer: functional
covers: ["AC6: optional repeated brand parameter"]
priority: P2
---

# TC-RANGE-1-05: Repeated brand parameters return the range of the union of those brands

## Why

- AC6 states `type` and `brand` may be repeated. Two brands are chosen so the lowest price comes from one and the highest from the other; a range taken from only the first or last value would fail.

## Preconditions

- `default` scenario. Daybird (brand 1): $49.99 – $449.99. Gravitator (brand 2): $59.99 – $699.00.

## Steps

1. Anonymous `GET /api/catalog/items/facets?api-version=1.0&brand=1&brand=2`.

## Expected result

- Status 200.
- `minPrice` is `49.99` (a Daybird item) and `maxPrice` is `699.00` (a Gravitator item).
