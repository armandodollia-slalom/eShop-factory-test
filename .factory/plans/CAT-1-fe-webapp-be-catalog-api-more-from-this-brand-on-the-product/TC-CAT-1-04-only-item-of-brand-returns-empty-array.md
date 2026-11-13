---
id: TC-CAT-1-04
type: happy
layer: functional
covers: ["AC3", "Outputs: empty array when the brand has no other items"]
priority: P1
---

# TC-CAT-1-04: The only item of its brand gets 200 with an empty array

## Why

- AC3: "no brand-mates" is a success, not a 404; the product page relies on an empty array to hide the section. Functional layer because it is an API status/body contract.

## Preconditions

- Scenario `brand-mates`: item 1020 "Lonely Lantern" is the only item of brand "Brand Solo".

## Steps

1. `GET /api/catalog/items/1020/brand-mates?api-version=1.0`.

## Expected result

- Status `200 OK`, body is exactly the JSON array `[]`.
