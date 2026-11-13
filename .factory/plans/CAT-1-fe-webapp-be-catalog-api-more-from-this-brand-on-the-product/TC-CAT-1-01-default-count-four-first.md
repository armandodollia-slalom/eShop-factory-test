---
id: TC-CAT-1-01
type: happy
layer: functional
covers: ["AC1", "Outputs: other items of the same brand, never the item itself", "Outputs: ordered by name", "Inputs: count default 4"]
priority: P1
---

# TC-CAT-1-01: Default count returns the four first other items by name, excluding the item itself

## Why

- AC1 is the core rule: same brand, exclusion of the item, name ordering and default limit. Item 203 sits inside the first four by name, so a missing exclusion would show up. Functional layer: pure API contract against the real database; the call is anonymous, which also covers the anonymous-read requirement.

## Preconditions

- Scenario `brand-mates` loaded (see `_index.md`, "Test data"). Item 203 "Charlie Tent" exists; brand 20 has six other items.

## Steps

1. `GET /api/catalog/items/203/brand-mates?api-version=1.0` with no Authorization header.

## Expected result

- Status `200`, JSON array of exactly 4 items.
- Names in order: "Alpha Tent", "Bravo Tent", "Delta Tent", "Echo Tent" (ids 201, 202, 204, 205).
- No element has `id` 203.
- Every element belongs to brand 20.
