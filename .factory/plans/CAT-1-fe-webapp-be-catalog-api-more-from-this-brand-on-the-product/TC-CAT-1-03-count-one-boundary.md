---
id: TC-CAT-1-03
type: sad
sad-path: boundary
layer: functional
covers: ["Inputs: count lower bound 1", "Outputs: at most count items"]
priority: P2
---

# TC-CAT-1-03: count=1 (lowest valid value) returns only the first other item

## Why

- Boundary just inside the lower limit of `count`: 1 must be accepted and cap the result at one item, the first by name. Without it a `count >= 1` vs `> 1` off-by-one would go unnoticed. Functional layer, same data as the other API cases.

## Preconditions

- Scenario `brand-mates` as in TC-CAT-1-01.

## Steps

1. `GET /api/catalog/items/1001/brand-mates?count=1&api-version=1.0`.

## Expected result

- Status `200 OK`, JSON array of exactly 1 item named "Bravo Pack".
