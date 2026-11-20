---
id: TC-BRAND-3-02
type: happy
layer: functional
covers: ["AC4: sort=name orders the brands by name"]
priority: P1
---

# TC-BRAND-3-02: Summary with sort=name orders brands alphabetically

## Why

- AC4 makes `name` an explicitly accepted value; a validator that only lets `count` through, or a switch that maps `name` to the count order, would break it. The ids are not in name order (id 1 is Daybird), so an unordered or id-ordered result fails. Functional is the cheapest layer with the real query.

## Preconditions

- The case runs in `BrandSummaryTests` (its own `CatalogApiFixture` database), not in `CatalogApiTests`, so the catalog holds the unchanged demo data: 13 brands (ids 1 to 13), 101 items.

## Steps

1. Send `GET /api/catalog/catalogbrands/summary?api-version=1.0&sort=name` anonymously.

## Expected result

- Status `200`.
- The body is an array of 13 entries, and the `(id, brand)` pairs in order are: (9, "AirStrider"), (5, "B&R"), (1, "Daybird"), (2, "Gravitator"), (10, "Green Equipment"), (8, "Grolltex"), (12, "Legend"), (4, "Quester"), (6, "Raptor Elite"), (7, "Solstix"), (3, "WildRunner"), (13, "XE"), (11, "Zephyr").
