---
id: TC-CAT-1-05
type: happy
layer: functional
covers: ["Outputs: at most count items"]
priority: P2
---

# TC-CAT-1-05: Fewer mates than the default count returns all of them

## Why

- Distinguishes "at most count" from "exactly count": the endpoint must not pad or fail when the brand has fewer than four other items.

## Preconditions

- Scenario `brand-mates` loaded; brand 22 has exactly items 220 "Duo One" and 221 "Duo Two".

## Steps

1. `GET /api/catalog/items/220/brand-mates?api-version=1.0`.

## Expected result

- Status `200`, array of exactly 1 item: "Duo Two" (id 221).
- Item 220 is absent.
