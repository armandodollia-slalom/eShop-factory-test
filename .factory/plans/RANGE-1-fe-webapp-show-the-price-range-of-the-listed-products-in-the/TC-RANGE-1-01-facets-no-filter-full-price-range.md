---
id: TC-RANGE-1-01
type: happy
layer: functional
covers: ["AC6: minPrice and maxPrice for the items the filters select", "AC1 data: $21.99 – $699.00 across the whole catalog"]
priority: P1
---

# TC-RANGE-1-01: Facets without filters return minPrice 21.99 and maxPrice 699.00

## Why

- AC6 adds `minPrice`/`maxPrice` to the facets response and AC1 depends on the unfiltered values being the cheapest and dearest of all 101 items, not of one page. The functional layer checks the API contract directly against the real Postgres seed, which is cheaper than the browser and isolates the server computation from the rendering.

## Preconditions

- Catalog database seeded with the `default` scenario: 101 items, cheapest $21.99, dearest $699.00.

## Steps

1. Anonymous `GET /api/catalog/items/facets?api-version=1.0` with no `type` and no `brand` parameter.

## Expected result

- Status 200, JSON body.
- `minPrice` is `21.99` and `maxPrice` is `699.00` (numeric values, equal to 21.99 and 699 as decimals).
