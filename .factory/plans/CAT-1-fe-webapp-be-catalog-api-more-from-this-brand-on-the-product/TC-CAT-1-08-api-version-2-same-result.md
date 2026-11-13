---
id: TC-CAT-1-08
type: happy
layer: functional
covers: ["Inputs: API versions 1.0 and 2.0"]
priority: P2
---

# TC-CAT-1-08: The endpoint also answers on API version 2.0

## Why

- The story states the endpoint exists in both versions 1.0 and 2.0; the other cases use 1.0. A route registered in only one version group would break the WebApp or other clients on the other. Functional layer: routing/versioning contract.

## Preconditions

- Scenario `brand-mates` as in TC-CAT-1-01.

## Steps

1. `GET /api/catalog/items/1001/brand-mates?api-version=2.0`.

## Expected result

- Status `200 OK`, JSON array of 4 items named "Bravo Pack", "Charlie Pack", "Delta Pack", "Echo Pack", in that order.
