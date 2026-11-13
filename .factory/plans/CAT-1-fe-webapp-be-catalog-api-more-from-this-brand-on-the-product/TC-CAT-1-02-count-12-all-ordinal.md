---
id: TC-CAT-1-02
type: happy
layer: functional
covers: ["AC2", "Inputs: count 12 (upper valid bound)", "Outputs: ordered by name (ascending, ordinal)"]
priority: P1
---

# TC-CAT-1-02: count=12 returns all six other items in ordinal name order

## Why

- AC2 and the upper valid boundary of `count`. The lowercase "zulu tent" checks that ordering is ordinal (uppercase before lowercase) as the story states, not culture-aware. Functional layer, real Postgres.

## Preconditions

- Scenario `brand-mates` loaded; item 203 exists.

## Steps

1. `GET /api/catalog/items/203/brand-mates?count=12&api-version=1.0`.

## Expected result

- Status `200`, array of exactly 6 items.
- Names in order: "Alpha Tent", "Bravo Tent", "Delta Tent", "Echo Tent", "Foxtrot Tent", "zulu tent" (ids 201, 202, 204, 205, 206, 207).
- Item 203 is absent.
