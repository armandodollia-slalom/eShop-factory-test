---
id: TC-RANGE-1-08
type: happy
layer: functional
covers: ["AC6: other fields unchanged"]
priority: P2
---

# TC-RANGE-1-08: The facets' existing fields are unchanged by the new price fields

## Why

- AC6 requires the existing fields to stay as they were. The price selection reuses the brand-scoped query that also feeds the type counts, so a change there could alter the badges. Daybird is used because it filters the type counts while leaving the brand counts unfiltered.

## Preconditions

- `default` scenario. Daybird (brand 1) items per type: Footwear (1) 2, Ski/boarding (3) 4, Bags (4) 1, Trekking (5) 1, Jackets (6) 1, Cycling (8) 1.

## Steps

1. Anonymous `GET /api/catalog/items/facets?api-version=1.0&brand=1`.

## Expected result

- Status 200.
- The body's properties are exactly `brandCounts`, `typeCounts`, `brandTotal`, `typeTotal`, `minPrice`, `maxPrice`.
- `typeCounts` holds exactly `{id 1, count 2}`, `{id 3, count 4}`, `{id 4, count 1}`, `{id 5, count 1}`, `{id 6, count 1}`, `{id 8, count 1}` (in any order); `typeTotal` is 10.
- `brandCounts` holds 13 entries whose counts sum to 101, Daybird's entry is `{id 1, count 10}`; `brandTotal` is 101.
