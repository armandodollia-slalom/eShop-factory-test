---
id: TC-BUG-48-03
type: happy
layer: functional
covers: ["Expected: as in step 2 (GET /api/catalog/items?pageSize=1)", "Steps to Reproduce step 2 comparison with the catalog list"]
priority: P2
---

# TC-BUG-48-03: An item fetched by ids carries the same brand as in the catalog list

## Why

- The bug report names the catalog list as the second reference that already shows the brand. This case ties the batch endpoint to the list endpoint, so the two read paths cannot disagree on an item's brand again. The list is ordered by name, so the item is taken from the list answer rather than assumed to be item 1. Functional is enough: both are plain API reads.

## Preconditions

- Catalog seeded with the demo catalog (101 items).

## Steps

1. Send `GET /api/catalog/items?pageSize=1&pageIndex=0&api-version=1.0` anonymously; take the single element of `data` and call its `id` N.
2. Send `GET /api/catalog/items/by?ids=N&api-version=1.0` anonymously (N from step 1).

## Expected result

- Both requests answer `200 OK`.
- Step 1's `data` has exactly 1 element, with a non-null `catalogBrand`.
- Step 2 answers a JSON array with exactly 1 element whose `id` is N.
- That element's `catalogBrand` is non-null and its `id` and `brand` equal the `catalogBrand.id` and `catalogBrand.brand` of the step 1 element; its `catalogBrandId` equals the step 1 element's `catalogBrandId`.
