---
id: TC-BRAND-1-02
type: happy
layer: functional
covers: ["AC5: itemCount", "AC5: lowestPrice", "Implementation Notes: counts add up to the number of catalog items"]
priority: P1
---

# TC-BRAND-1-02: Summary endpoint returns each brand's item count and lowest price

## Why

- The count and lowest price are what the cards show (AC3); a wrong group-by or join (for example counting across brands, or using Max instead of Min) would show wrong numbers on every card. Kept separate from TC-BRAND-1-01 so an aggregation error is reported apart from an order error. Functional runs the real aggregation in Postgres.

## Preconditions

- The case runs in its own functional test class with its own `CatalogApiFixture` instance (its own catalog database), not in `CatalogApiTests`, and no test that changes catalog data shares that database. `CatalogApiTests` reprices item 1 (Daybird), deletes items 5 (B&R) and 6 (Raptor Elite) and adds an item to brand 13 (XE), so the exact demo values only hold in an unshared database.
- That database holds the unchanged demo catalog the fixture seeds: 13 brands (ids 1 to 13), 101 items.

## Steps

1. Send `GET /api/catalog/catalogbrands/summary?api-version=1.0` anonymously.

## Expected result

- Status `200`.
- `itemCount` and `lowestPrice` per `id`:
  - 1 Daybird: 10, 49.99
  - 2 Gravitator: 11, 59.99
  - 3 WildRunner: 11, 69.99
  - 4 Quester: 4, 49.99
  - 5 B&R: 10, 59.99
  - 6 Raptor Elite: 11, 69.99
  - 7 Solstix: 9, 89.00
  - 8 Grolltex: 5, 29.99
  - 9 AirStrider: 6, 54.99
  - 10 Green Equipment: 7, 59.99
  - 11 Zephyr: 6, 109.99
  - 12 Legend: 8, 21.99
  - 13 XE: 3, 199.00
- The sum of `itemCount` over all entries is 101, equal to the `count` returned by `GET /api/catalog/items?api-version=1.0&pageSize=1`.
- No `lowestPrice` is null.
