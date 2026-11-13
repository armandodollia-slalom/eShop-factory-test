---
id: TC-CAT-1-10
type: happy
layer: functional
covers: ["Outputs: same item shape as GET /api/catalog/items/{id}"]
priority: P2
---

# TC-CAT-1-10: Each returned item has the same shape and values as GET /items/{id}

## Why

- The story says the elements have the same shape as `GET /api/catalog/items/{id}` (the WebApp deserializes them as catalog items and renders cards from them). Comparing against the single-item endpoint catches missing or renamed fields. Functional layer: JSON contract.

## Preconditions

- Scenario `brand-mates` as in TC-CAT-1-01.

## Steps

1. `GET /api/catalog/items/1001/brand-mates?count=1&api-version=1.0`; keep the single element.
2. `GET /api/catalog/items/1002?api-version=1.0`.

## Expected result

- Both return `200 OK`.
- The element from step 1 and the body from step 2 have the same set of JSON property names and the same values (id 1002, name "Bravo Pack", price, picture file name, catalog brand "Brand Alpha", catalog type, stock).
