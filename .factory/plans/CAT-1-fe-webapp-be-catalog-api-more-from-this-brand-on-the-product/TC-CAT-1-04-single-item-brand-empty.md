---
id: TC-CAT-1-04
type: happy
layer: functional
covers: ["AC3", "Outputs: an empty array when the brand has no other items"]
priority: P1
---

# TC-CAT-1-04: Only item of its brand returns 200 with an empty array

## Why

- AC3: an empty brand-mate set must be `200` with `[]`, not 404 or null; the product page relies on it to hide the section. Functional layer.

## Preconditions

- Scenario `brand-mates` loaded; item 210 "Lone Lantern" is the only item of brand 21.

## Steps

1. `GET /api/catalog/items/210/brand-mates?api-version=1.0`.

## Expected result

- Status `200`.
- Body is the JSON array `[]` (not null, not an object).
