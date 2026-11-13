---
id: TC-CAT-1-06
type: happy
layer: functional
covers: ["Open Questions: out-of-stock items are included"]
priority: P2
---

# TC-CAT-1-06: Out-of-stock brand-mates are included

## Why

- The story's answered open question says stock is not part of the rule. Item 202 has AvailableStock 0 and would disappear if a stock filter were applied. Separate case because it is an explicit decision.

## Preconditions

- Scenario `brand-mates` loaded; item 202 "Bravo Tent" has AvailableStock 0.

## Steps

1. `GET /api/catalog/items/203/brand-mates?count=2&api-version=1.0`.

## Expected result

- Status `200`, array of exactly 2 items: "Alpha Tent" (201) then "Bravo Tent" (202).
