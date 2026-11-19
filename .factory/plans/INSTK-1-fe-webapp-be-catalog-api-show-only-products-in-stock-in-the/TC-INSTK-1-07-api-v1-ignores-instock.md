---
id: TC-INSTK-1-07
type: happy
layer: functional
covers: ["AC5: the filter is added to version 2.0", "Impl notes (product owner): version 1.0 does not change"]
priority: P2
---

# TC-INSTK-1-07: v1 items list ignores inStock

## Why

- The filter belongs to version 2.0 only; version 1.0 clients must keep getting the full list even if they send the parameter. Sharing `GetAllItems` between versions makes leaking the filter into v1 an easy mistake.

## Preconditions

- Catalog functional fixture with the INSTK-1 stock set (11 items at `AvailableStock` 0).

## Steps

1. Anonymous `GET /api/catalog/items?api-version=1.0&inStock=true&PageSize=101&PageIndex=0`.

## Expected result

- Status 200.
- `count` is 101; `data` has 101 items, including items 53, 92, 13, 5, 32, 26, 4, 8, 9, 10 and 19.
