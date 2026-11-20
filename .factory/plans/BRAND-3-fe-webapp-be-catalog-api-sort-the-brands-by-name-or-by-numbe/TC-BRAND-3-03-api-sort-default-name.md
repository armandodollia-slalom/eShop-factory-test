---
id: TC-BRAND-3-03
type: happy
layer: functional
covers: ["AC4: name is the default when sort is absent"]
priority: P1
---

# TC-BRAND-3-03: Summary without sort keeps the alphabetical order

## Why

- AC4 says `name` is the default. Adding the parameter must not make it required (a missing value must not answer 400) nor change the BRAND-1 contract the page relies on. Functional, same endpoint as TC-BRAND-3-02, kept separate because "absent" and "name" go through different code paths.

## Preconditions

- The case runs in `BrandSummaryTests` (its own `CatalogApiFixture` database), not in `CatalogApiTests`, so the catalog holds the unchanged demo data: 13 brands (ids 1 to 13), 101 items.

## Steps

1. Send `GET /api/catalog/catalogbrands/summary?api-version=1.0` anonymously (no `sort` parameter).

## Expected result

- Status `200` (not 400).
- The body is an array of 13 entries, and the `(id, brand)` pairs in order are: (9, "AirStrider"), (5, "B&R"), (1, "Daybird"), (2, "Gravitator"), (10, "Green Equipment"), (8, "Grolltex"), (12, "Legend"), (4, "Quester"), (6, "Raptor Elite"), (7, "Solstix"), (3, "WildRunner"), (13, "XE"), (11, "Zephyr").
