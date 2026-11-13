---
id: TC-CAT-1-02
type: happy
layer: functional
covers: ["AC2", "Inputs: count upper bound 12", "Outputs: ordered by name (ascending, ordinal)"]
priority: P1
---

# TC-CAT-1-02: count=12 returns all six other items in ordinal name order

## Why

- AC2 and the upper boundary just inside the limit (12) when the brand has fewer items than count. Ordinal ordering is checked here with the lowercase name that must come last (uppercase letters sort before lowercase in ordinal order). Functional layer: API contract on the real database.

## Preconditions

- Scenario `brand-mates` as in TC-CAT-1-01.

## Steps

1. `GET /api/catalog/items/1001/brand-mates?count=12&api-version=1.0`.

## Expected result

- Status `200 OK`, JSON array of exactly 6 items.
- Names in order: "Bravo Pack", "Charlie Pack", "Delta Pack", "Echo Pack", "Foxtrot Pack", "alpha lowercase pack".
- Item 1001 is not in the array.
