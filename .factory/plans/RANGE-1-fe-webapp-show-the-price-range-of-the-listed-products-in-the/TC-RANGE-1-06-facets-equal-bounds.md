---
id: TC-RANGE-1-06
type: happy
layer: functional
covers: ["AC6: minPrice and maxPrice", "AC3 data: lowest and highest price are the same"]
priority: P2
---

# TC-RANGE-1-06: A selection whose items share one price returns equal minPrice and maxPrice

## Why

- AC3's single-price display relies on the API returning equal bounds for such a selection. A two-item selection with one shared price is used instead of a one-item selection, so the case proves the bounds are a min and max over several rows, not the first row's price twice.

## Preconditions

- `default` scenario. Raptor Elite (brand 6) Cycling (type 8) items: 58 "VelociX 2000 Bike Helmet" and 86 "ProVent Bike Helmet", both $79.99.

## Steps

1. Anonymous `GET /api/catalog/items/facets?api-version=1.0&brand=6&type=8`.

## Expected result

- Status 200.
- `minPrice` is `79.99` and `maxPrice` is `79.99`.
