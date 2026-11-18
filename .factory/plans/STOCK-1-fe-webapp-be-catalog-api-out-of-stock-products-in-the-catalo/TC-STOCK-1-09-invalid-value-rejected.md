---
id: TC-STOCK-1-09
type: sad
sad-path: validation
layer: functional
covers: ["AC4", "Inputs: any other value is rejected", "Outputs: 400 validation problem naming onlyAvailable"]
priority: P1
---

# TC-STOCK-1-09: onlyAvailable=maybe returns 400 with a validation problem naming onlyAvailable

## Why

- AC4 and the Outputs fix the error contract: status 400, `application/problem+json`, and the problem names `onlyAvailable`. Without it a client typo would silently return the full catalog or a 500. Functional because content type and problem body are produced by the real pipeline.

## Preconditions

- Functional fixture (`CatalogApiFixture`): the catalog database holds exactly the 101 seeded demo items. Item 1 "Wanderer Black Hiking Boots" (brand 1 Daybird, type 1 Footwear) and item 2 "Summit Pro Harness" (brand 2 Gravitator, type 2 Climbing) have `AvailableStock` 0; items 3 to 101 have `AvailableStock` 100.

## Steps

1. Anonymous `GET /api/catalog/items?api-version=2.0&onlyAvailable=maybe`.

## Expected result

- Status 400.
- `Content-Type` media type is `application/problem+json`.
- The body's `errors` object has a key `onlyAvailable` with at least one non-empty message.
- The body has no `data` or `count` property.
