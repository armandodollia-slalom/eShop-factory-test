---
id: TC-CAT-1-05
type: sad
sad-path: not-found
layer: functional
covers: ["AC4", "Outputs: 404 Not Found when no item has that id"]
priority: P1
---

# TC-CAT-1-05: Unknown item id returns 404

## Why

- AC4: an unknown item must be distinguishable from a brand without other items (TC-CAT-1-04). Functional layer: status code contract.

## Preconditions

- Scenario `brand-mates` (or `default`); no item with id 999999.

## Steps

1. `GET /api/catalog/items/999999/brand-mates?api-version=1.0`.

## Expected result

- Status `404 Not Found`.
- The body is not a JSON array of items.
