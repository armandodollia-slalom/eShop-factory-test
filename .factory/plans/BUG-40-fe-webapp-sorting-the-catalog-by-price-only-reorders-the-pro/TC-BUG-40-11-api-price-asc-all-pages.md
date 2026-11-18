---
id: TC-BUG-40-11
type: happy
layer: functional
covers: ["Expected: whole catalog in price order across its pages; no product on a later page costs less", "Expected: product count unchanged; each page shows 9 products", "Implementation Notes: sort applied before Skip/Take; price ties broken by Name then Id"]
priority: P1
---

# TC-BUG-40-11: API: price-asc orders all 101 items across every page

## Why

- "No product on a later page costs less than a product on an earlier page" is a statement about all 12 pages; only a page-by-page walk proves it, and that is cheap and exact against the API the WebApp now calls. It also proves no item is repeated or skipped between pages, which a non-deterministic tie-break would break (ten items cost 79.99).

## Preconditions

- `tests/Catalog.FunctionalTests` with `CatalogApiFixture` (seeded from `src/Catalog.API/Setup/catalog.json`: 101 items, same ids and prices as the `default` scenario).
- HTTP client with api-version `2.0`.

## Steps

1. For `pageIndex` = 0 to 11, send `GET /api/catalog/items?pageIndex=<n>&pageSize=9&sort=price-asc&api-version=2.0` (anonymous).
2. Concatenate `data` from the 12 responses in page order.

## Expected result

- Every response is `200`, with `count` = `101` and `pageSize` = `9`; pages 0 to 10 have 9 items each and page 11 has 2.
- Page 0 `data[*].id` is exactly `[31, 51, 97, 85, 34, 66, 54, 14, 10]` with prices `[21.99, 29.99, 49.99, 49.99, 54.99, 59.99, 59.99, 59.99, 59.99]`.
- Page 11 `data[*].id` is exactly `[42, 72]`, both price `699.00`.
- The concatenated list has 101 items, 101 distinct ids, and each item's `price` is greater than or equal to the previous item's `price`.
