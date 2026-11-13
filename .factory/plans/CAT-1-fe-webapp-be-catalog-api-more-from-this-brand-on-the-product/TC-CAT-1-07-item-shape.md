---
id: TC-CAT-1-07
type: happy
layer: functional
covers: ["Outputs: the same item shape as GET /api/catalog/items/{id}"]
priority: P2
---

# TC-CAT-1-07: Returned items have the same shape as the single-item endpoint

## Why

- The story requires the same item shape so clients can reuse their model. Comparing against the single-item response catches renamed or missing fields.

## Preconditions

- Scenario `brand-mates` loaded.

## Steps

1. `GET /api/catalog/items/201?api-version=1.0`; keep the JSON body.
2. `GET /api/catalog/items/203/brand-mates?count=1&api-version=1.0`.

## Expected result

- The single element of step 2 (item 201) has exactly the same set of property names, and the same values, as the body of step 1.
