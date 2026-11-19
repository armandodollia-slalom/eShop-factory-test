---
id: TC-INSTK-1-02
type: sad
sad-path: boundary
layer: functional
covers: ["AC2: at least one unit in stock (boundary 1 in, 0 out)"]
priority: P1
---

# TC-INSTK-1-02: Stock boundary: 1 unit is listed, 0 units is not

## Why

- AC2 sets the limit at "at least one unit"; an off-by-one (`>= 0` or `> 1`) would either show sold-out products or hide the last unit. Brand Daybird holds both sides of the limit (item 71 at 1, items 13, 53, 92 at 0), so one functional request checks just inside and just outside.

## Preconditions

- Catalog functional fixture with the INSTK-1 stock set: Daybird (brand 1) items 1, 25, 39, 49, 62, 85 at 100, item 71 Explorer Frost Boots at 1, items 13, 53, 92 at 0.

## Steps

1. Anonymous `GET /api/catalog/items?api-version=2.0&inStock=true&brand=1&PageSize=20&PageIndex=0`.

## Expected result

- Status 200.
- `count` is 7; `data` ids are exactly {1, 25, 39, 49, 62, 71, 85}.
- Item 71 is present with `availableStock` 1.
- Items 13, 53 and 92 are absent.
