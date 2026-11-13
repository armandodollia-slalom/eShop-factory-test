---
id: TC-CAT-1-10
type: sad
sad-path: boundary
layer: functional
covers: ["AC5", "Outputs: 400 when count is below 1", "Inputs: count 1 to 12"]
priority: P1
---

# TC-CAT-1-10: count=0 is rejected with 400 problem details

## Why

- AC5 lower boundary, just outside the limit. TC-CAT-1-03 covers count=1 just inside.

## Preconditions

- Scenario `brand-mates` loaded; item 203 exists.

## Steps

1. `GET /api/catalog/items/203/brand-mates?count=0&api-version=1.0`.

## Expected result

- Status `400`.
- Body is a problem details JSON document (`status` 400 and a `title`).
