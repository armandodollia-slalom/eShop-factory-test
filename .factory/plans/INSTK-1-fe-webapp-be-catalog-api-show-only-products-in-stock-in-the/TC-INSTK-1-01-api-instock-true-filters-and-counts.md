---
id: TC-INSTK-1-01
type: happy
layer: functional
covers: ["AC2: lists only products with at least one unit in stock", "AC2: the product count counts only those", "AC5: GET /api/catalog/items v2 accepts an optional in-stock filter"]
priority: P1
---

# TC-INSTK-1-01: v2 items list with inStock=true returns only in-stock items and counts only them

## Why

- The API filter is the source of truth for the WebApp list and its counts (AC2, AC5); if it filtered after counting, or not at all, the shopper would see out-of-stock products or a wrong total. Functional is the cheapest layer that runs the real query against Postgres.

## Preconditions

- Catalog functional fixture with the demo catalog and the INSTK-1 stock set (see `_index.md`): items 53, 92, 13, 5, 32, 26, 4, 8, 9, 10, 19 at `AvailableStock` 0, item 71 at 1, all others at 100.

## Steps

1. Anonymous `GET /api/catalog/items?api-version=2.0&inStock=true&PageSize=100&PageIndex=0`.

## Expected result

- Status 200.
- `count` is 90; `pageIndex` 0; `pageSize` 100; `data` has 90 items.
- No item in `data` has `availableStock` 0, and none has id 53, 92, 13, 5, 32, 26, 4, 8, 9, 10 or 19.
- Every item in `data` has `availableStock` greater than 0.
