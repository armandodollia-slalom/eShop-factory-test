---
id: TC-RANGE-1-04
type: happy
layer: functional
covers: ["AC6: range for the items both filters select", "AC2: Daybird + Footwear $109.99 – $149.99"]
priority: P1
---

# TC-RANGE-1-04: Facets for brand Daybird and type Footwear return 109.99 and 149.99

## Why

- AC6 says the range is for the items "those filters select", which with both filters is their intersection. The badge counts scope each facet by the other filter only, so a range computed from either badge scope would be wrong (Daybird alone gives 49.99–449.99, Footwear alone a different range); this case catches that mix-up.

## Preconditions

- `default` scenario. Daybird (brand 1) Footwear (type 1) items: two, priced $109.99 and $149.99.

## Steps

1. Anonymous `GET /api/catalog/items/facets?api-version=1.0&brand=1&type=1`.

## Expected result

- Status 200.
- `minPrice` is `109.99` and `maxPrice` is `149.99`.
