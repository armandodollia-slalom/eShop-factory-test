---
id: TC-BUG-40-12
type: happy
layer: functional
covers: ["Expected: Price: High to Low works the same way in its own order", "Implementation Notes: price-desc ties broken by Name then Id"]
priority: P1
---

# TC-BUG-40-12: API: price-desc orders all 101 items across every page

## Why

- Same whole-catalog guarantee as TC-BUG-40-11 for the opposite direction; a separate case because descending price uses its own ordering expression and tie-break (name ascending), which could be wired wrong independently.

## Preconditions

- `CatalogApiFixture` seeded with the 101 catalog items. HTTP client with api-version `2.0`.

## Steps

1. For `pageIndex` = 0 to 11, send `GET /api/catalog/items?pageIndex=<n>&pageSize=9&sort=price-desc&api-version=2.0`.
2. Concatenate `data` from the 12 responses in page order.

## Expected result

- Every response is `200` with `count` = `101`.
- Page 0 `data[*].id` is exactly `[42, 72, 22, 92, 32, 43, 12, 83, 62]`.
- Page 1 `data[0].id` is `53` (Raven Swift Snowboard, `349.00`).
- Page 11 `data[*].id` is exactly `[51, 31]` (prices `29.99`, `21.99`).
- The concatenated list has 101 distinct ids, and each item's `price` is less than or equal to the previous item's `price`.
