---
id: TC-BUG-18-04
type: sad
sad-path: boundary
layer: functional
covers: ["Expected: 409 Conflict", "Existing id check covers the whole id range"]
priority: P2
---

# TC-BUG-18-04: The highest seeded id (101) is rejected with 409

## Why

- The check must be an existence lookup, not an id range rule; the last seeded id is the boundary just inside existing ids.

## Preconditions

- Catalog API running in-process on the `default` scenario (101 items with ids 1 to 101; brand 1 and type 1 exist); no authentication needed.

## Steps

1. `POST /api/catalog/items?api-version=2.0` with the body from TC-BUG-18-01 but `"id":101`.

## Expected result

- Status `409 Conflict`; not 500.
