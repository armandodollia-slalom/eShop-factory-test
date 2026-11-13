---
id: TC-CAT-1-03
type: happy
layer: functional
covers: ["Inputs: count 1 (lower valid bound)", "Outputs: at most count items"]
priority: P2
---

# TC-CAT-1-03: count=1 returns only the first other item by name

## Why

- Lower valid boundary of `count` (just inside the limit) and proof that a count below the default is honored. Separate from case 01, which checks the default.

## Preconditions

- Scenario `brand-mates` loaded; item 203 exists.

## Steps

1. `GET /api/catalog/items/203/brand-mates?count=1&api-version=1.0`.

## Expected result

- Status `200`, array of exactly 1 item: "Alpha Tent" (id 201).
