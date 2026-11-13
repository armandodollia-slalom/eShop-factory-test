---
id: TC-CAT-1-07
type: sad
sad-path: boundary
layer: functional
covers: ["AC5", "Inputs: count 1 to 12", "Outputs: 400 problem details when count above 12"]
priority: P1
---

# TC-CAT-1-07: count=13 (just above the upper limit) returns 400 problem details

## Why

- AC5, upper boundary just outside the limit (12 is accepted in TC-CAT-1-02). Functional layer: validation contract.

## Preconditions

- Scenario `brand-mates`; item 1001 exists.

## Steps

1. `GET /api/catalog/items/1001/brand-mates?count=13&api-version=1.0`.

## Expected result

- Status `400 Bad Request`.
- Content type is `application/problem+json` and the body has a `status` field equal to 400.
