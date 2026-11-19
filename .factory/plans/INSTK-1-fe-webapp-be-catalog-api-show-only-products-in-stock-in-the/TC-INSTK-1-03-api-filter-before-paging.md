---
id: TC-INSTK-1-03
type: happy
layer: functional
covers: ["AC2: the pages count only in-stock products", "AC3: paging keeps the filters", "Impl notes: filter before counting and paging"]
priority: P1
---

# TC-INSTK-1-03: inStock=true filters before paging (type filter, second page)

## Why

- If the filter were applied after `Skip/Take`, a page would hold fewer than 9 items or skip in-stock items, and the total would not match the pages (AC2, AC3). Ski/boarding has 18 items, 4 of them out of stock, so the second page of 9 shows exactly whether paging runs on the filtered set.

## Preconditions

- Catalog functional fixture with the INSTK-1 stock set: Ski/boarding (type 3) items 53, 92, 5, 32 at `AvailableStock` 0, the other 14 in stock.

## Steps

1. Anonymous `GET /api/catalog/items?api-version=2.0&inStock=true&type=3&PageSize=9&PageIndex=1`.

## Expected result

- Status 200.
- `count` is 14; `pageIndex` 1; `pageSize` 9.
- `data` has 5 items whose ids are exactly {12, 62, 60, 22, 30} (Powder Pro Snowboard, Shadow Black Snowboard, SummitRider Snowboard Boots, Venture 2022 Snowboard, Zero Gravity Ski Goggles).
- None of ids 53, 92, 5, 32 is in `data`.
