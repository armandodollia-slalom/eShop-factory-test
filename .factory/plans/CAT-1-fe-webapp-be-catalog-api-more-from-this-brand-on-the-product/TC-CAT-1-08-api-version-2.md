---
id: TC-CAT-1-08
type: happy
layer: functional
covers: ["Inputs: API versions 1.0 and 2.0", "Inputs: anonymous like the other catalog reads"]
priority: P1
---

# TC-CAT-1-08: The endpoint is available and equivalent in API version 2.0

## Why

- The story says the endpoint exists in both API versions. A mapping on only one version group would break clients of the other. Functional layer because versioning is an API routing concern.

## Preconditions

- Scenario `brand-mates` loaded.

## Steps

1. `GET /api/catalog/items/203/brand-mates?api-version=2.0` with no Authorization header.

## Expected result

- Status `200`, the same 4 items in the same order as TC-CAT-1-01 (ids 201, 202, 204, 205).
