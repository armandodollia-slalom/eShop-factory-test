---
id: TC-RANGE-1-02
type: happy
layer: functional
covers: ["AC6: range for the brand filter", "AC2: brand Daybird $49.99 – $449.99"]
priority: P1
---

# TC-RANGE-1-02: Facets for brand Daybird return 49.99 and 449.99

## Why

- AC6 requires the range to follow the `brand` filter, and AC2 names Daybird's range. A broken brand filter (range of the whole catalog) would show $21.99 – $699.00 instead; checking the API pins the server computation separately from the UI case TC-RANGE-1-10.

## Preconditions

- `default` scenario. Brand Daybird has id 1 and 10 items priced from $49.99 to $449.99.

## Steps

1. Anonymous `GET /api/catalog/items/facets?api-version=1.0&brand=1`.

## Expected result

- Status 200.
- `minPrice` is `49.99` and `maxPrice` is `449.99`.
