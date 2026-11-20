---
id: TC-BRAND-1-01
type: happy
layer: functional
covers: ["AC5: every brand as { id, brand, itemCount, lowestPrice }", "AC5: ordered by brand name"]
priority: P1
---

# TC-BRAND-1-01: Summary endpoint returns every brand once, ordered by name, with the four fields

## Why

- AC5 is the API contract the Brands page depends on: every brand once, in name order, with exactly the fields `id`, `brand`, `itemCount`, `lowestPrice`. The seeded ids are not in name order (id 1 is Daybird, id 9 is AirStrider), so an id-ordered query would fail this case. Functional is the cheapest layer that runs the real EF query against Postgres.

## Preconditions

- The case runs in its own functional test class with its own `CatalogApiFixture` instance (its own catalog database), not in `CatalogApiTests`, and no test that changes catalog data shares that database. `CatalogApiTests` reprices item 1 (Daybird), deletes items 5 (B&R) and 6 (Raptor Elite) and adds an item to brand 13 (XE), so the exact demo values only hold in an unshared database.
- That database holds the unchanged demo catalog the fixture seeds: 13 brands (ids 1 to 13), 101 items.

## Steps

1. Send `GET /api/catalog/catalogbrands/summary?api-version=1.0` anonymously.

## Expected result

- Status `200`, content type `application/json`.
- The body is a JSON array of 13 objects.
- Every object has exactly the properties `id`, `brand`, `itemCount`, `lowestPrice`.
- The `(id, brand)` pairs in order are: (9, "AirStrider"), (5, "B&R"), (1, "Daybird"), (2, "Gravitator"), (10, "Green Equipment"), (8, "Grolltex"), (12, "Legend"), (4, "Quester"), (6, "Raptor Elite"), (7, "Solstix"), (3, "WildRunner"), (13, "XE"), (11, "Zephyr").
- No `id` appears twice.
