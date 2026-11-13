---
id: TC-CAT-1-06
type: sad
sad-path: boundary
layer: functional
covers: ["AC5", "Inputs: count 1 to 12", "Outputs: 400 problem details when count below 1"]
priority: P1
---

# TC-CAT-1-06: count=0 (just below the lower limit) returns 400 problem details

## Why

- AC5, lower boundary just outside the limit. Functional layer: validation contract of the endpoint, including the problem details body the story requires.

## Preconditions

- Scenario `brand-mates`; item 1001 exists.

## Steps

1. `GET /api/catalog/items/1001/brand-mates?count=0&api-version=1.0`.

## Expected result

- Status `400 Bad Request`.
- Content type is `application/problem+json` and the body has a `status` field equal to 400.
