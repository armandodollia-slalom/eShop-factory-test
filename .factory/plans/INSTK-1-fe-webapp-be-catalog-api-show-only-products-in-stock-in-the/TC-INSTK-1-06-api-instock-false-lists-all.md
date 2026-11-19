---
id: TC-INSTK-1-06
type: happy
layer: functional
covers: ["AC5: the in-stock filter is optional", "Impl notes (product owner): when true, keep only in-stock items"]
priority: P2
---

# TC-INSTK-1-06: v2 items list with inStock=false lists every item

## Why

- The product owner's note filters only "when true"; an explicit `false` means the filter is off and must not be read as "only out-of-stock" (a plausible inversion bug). Kept separate from TC-INSTK-1-05 because it exercises a different binding path (value present, not absent).

## Preconditions

- Catalog functional fixture with the INSTK-1 stock set (11 items at `AvailableStock` 0).

## Steps

1. Anonymous `GET /api/catalog/items?api-version=2.0&inStock=false&PageSize=101&PageIndex=0`.

## Expected result

- Status 200.
- `count` is 101; `data` has 101 items, including items 53, 92, 13, 5, 32, 26, 4, 8, 9, 10 and 19 and the in-stock item 71.
