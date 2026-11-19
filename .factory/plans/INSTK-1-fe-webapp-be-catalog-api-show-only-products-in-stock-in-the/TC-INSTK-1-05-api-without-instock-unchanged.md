---
id: TC-INSTK-1-05
type: happy
layer: functional
covers: ["AC5: without the filter the list is exactly as today"]
priority: P1
---

# TC-INSTK-1-05: v2 items list without inStock is unchanged

## Why

- AC5 protects every existing client of the v2 list: without the new parameter, out-of-stock items must still be listed and counted. A default of `true` or a filter applied unconditionally would silently shrink the catalog for all callers.

## Preconditions

- Catalog functional fixture with the INSTK-1 stock set (11 items at `AvailableStock` 0).

## Steps

1. Anonymous `GET /api/catalog/items?api-version=2.0&PageSize=101&PageIndex=0`.

## Expected result

- Status 200.
- `count` is 101; `data` has 101 items.
- `data` contains items 53, 92, 13, 5, 32, 26, 4, 8, 9, 10 and 19, each with `availableStock` 0.
- Items in `data` are ordered by `name`, as before the change.
