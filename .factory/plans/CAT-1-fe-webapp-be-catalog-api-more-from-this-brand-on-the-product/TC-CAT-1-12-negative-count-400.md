---
id: TC-CAT-1-12
type: sad
sad-path: validation
layer: functional
covers: ["Outputs: 400 when count is below 1", "Inputs: count 1 to 12"]
priority: P2
---

# TC-CAT-1-12: Negative count is rejected with 400

## Why

- The range rule is "1 to 12", so any negative value is below 1. It is a different input class from 0 and could be handled differently (for example by an unsigned parse).

## Preconditions

- Scenario `brand-mates` loaded; item 203 exists.

## Steps

1. `GET /api/catalog/items/203/brand-mates?count=-1&api-version=1.0`.

## Expected result

- Status `400`.
