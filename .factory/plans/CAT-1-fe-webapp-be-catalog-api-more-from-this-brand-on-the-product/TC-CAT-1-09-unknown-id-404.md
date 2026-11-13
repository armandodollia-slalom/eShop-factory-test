---
id: TC-CAT-1-09
type: sad
sad-path: not-found
layer: functional
covers: ["AC4", "Outputs: 404 Not Found when no item has that id"]
priority: P1
---

# TC-CAT-1-09: Unknown item id returns 404

## Why

- AC4: the item lookup must fail with 404, not an empty array, so clients can tell a missing item from a brand with no mates.

## Preconditions

- Scenario `brand-mates` loaded; no item has id 999999.

## Steps

1. `GET /api/catalog/items/999999/brand-mates?api-version=1.0`.

## Expected result

- Status `404`.
