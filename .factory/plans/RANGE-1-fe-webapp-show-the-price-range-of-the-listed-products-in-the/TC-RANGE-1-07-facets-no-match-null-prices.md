---
id: TC-RANGE-1-07
type: happy
layer: functional
covers: ["AC6: null for both when none match", "AC4 data"]
priority: P1
---

# TC-RANGE-1-07: A selection with no items returns null for minPrice and maxPrice

## Why

- AC6 explicitly requires `null` for both bounds when the filters select nothing; a default of 0 would make the UI show "Price $0.00" for an empty selection. The filters used are a real brand and a real type with no item in common, so the response is not a not-found shortcut.

## Preconditions

- `default` scenario. Daybird (brand 1) has no Navigation (type 7) item.

## Steps

1. Anonymous `GET /api/catalog/items/facets?api-version=1.0&brand=1&type=7`.

## Expected result

- Status 200.
- The body has a `minPrice` property whose value is JSON `null` and a `maxPrice` property whose value is JSON `null` (present, not `0`).
