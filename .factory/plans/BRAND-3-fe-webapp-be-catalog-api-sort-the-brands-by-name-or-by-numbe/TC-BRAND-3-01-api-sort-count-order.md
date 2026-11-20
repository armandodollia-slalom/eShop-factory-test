---
id: TC-BRAND-3-01
type: happy
layer: functional
covers: ["AC4: sort=count orders by number of products, largest first", "AC2: brands with the same number in alphabetical order"]
priority: P1
---

# TC-BRAND-3-01: Summary with sort=count orders brands by item count descending, ties by name

## Why

- AC4 requires the API to order by number of products when `sort=count`, and AC2 requires equal counts to be alphabetical. The demo catalog has three ties (11, 10 and 6 products) whose ids are not in name order (WildRunner id 3 before Raptor Elite id 6; Daybird id 1 before B&R id 5), so an ascending order, a missing tie-break or an id tie-break all fail. Functional runs the real ordered query in Postgres.

## Preconditions

- The case runs in `BrandSummaryTests` (its own `CatalogApiFixture` database), not in `CatalogApiTests`, so the catalog holds the unchanged demo data: 13 brands (ids 1 to 13), 101 items.

## Steps

1. Send `GET /api/catalog/catalogbrands/summary?api-version=1.0&sort=count` anonymously.

## Expected result

- Status `200`, content type `application/json`.
- The body is an array of 13 entries, and the `(id, brand, itemCount)` triples in order are: (2, "Gravitator", 11), (6, "Raptor Elite", 11), (3, "WildRunner", 11), (5, "B&R", 10), (1, "Daybird", 10), (7, "Solstix", 9), (12, "Legend", 8), (10, "Green Equipment", 7), (9, "AirStrider", 6), (11, "Zephyr", 6), (8, "Grolltex", 5), (4, "Quester", 4), (13, "XE", 3).
- Each entry's `lowestPrice` is the same as in the unsorted response (for example id 2 Gravitator 59.99, id 13 XE 199.00): sorting changes only the order.
