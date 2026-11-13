---
id: TC-CAT-1-11
type: sad
sad-path: boundary
layer: functional
covers: ["AC5", "Outputs: 400 when count is above 12", "Inputs: count 1 to 12"]
priority: P1
---

# TC-CAT-1-11: count=13 is rejected with 400 problem details

## Why

- AC5 upper boundary, just outside the limit. TC-CAT-1-02 covers count=12 just inside.

## Preconditions

- Scenario `brand-mates` loaded; item 203 exists.

## Steps

1. `GET /api/catalog/items/203/brand-mates?count=13&api-version=1.0`.

## Expected result

- Status `400`.
- Body is a problem details JSON document (`status` 400 and a `title`).
