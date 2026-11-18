---
id: TC-BUG-48-01
type: happy
layer: functional
covers: ["Expected: every item in step 1 carries its brand (catalogBrand with id and brand)", "Actual: catalogBrand null no longer returned", "Expected: the same items", "Steps to Reproduce step 1"]
priority: P1
---

# TC-BUG-48-01: Items 1 and 2 fetched by ids each carry their own brand

## Why

- This is the bug's reproduction step 1 turned into an assertion: before the fix each item came back with `"catalogBrand": null`. Using items 1 and 2, which belong to two different brands (Daybird and Gravitator), proves each item gets its own brand rather than one shared value. Functional is the cheapest layer that runs the real endpoint and EF query against Postgres.

## Preconditions

- Catalog seeded with the demo catalog (101 items): item 1 "Wanderer Black Hiking Boots" with `catalogBrandId` 1, brand 1 = "Daybird"; item 2 "Summit Pro Harness" with `catalogBrandId` 2, brand 2 = "Gravitator".
- No authentication (catalog reads are anonymous).

## Steps

1. Send `GET /api/catalog/items/by?ids=1&ids=2&api-version=1.0` anonymously.

## Expected result

- Status `200 OK`, JSON array with exactly 2 elements; the set of `id` values is exactly {1, 2}.
- The element with `id` 1 has `name` "Wanderer Black Hiking Boots", `catalogBrandId` 1 and `catalogBrand` equal to `{"id": 1, "brand": "Daybird"}`.
- The element with `id` 2 has `name` "Summit Pro Harness", `catalogBrandId` 2 and `catalogBrand` equal to `{"id": 2, "brand": "Gravitator"}`.
- No element has `catalogBrand` null or missing.
