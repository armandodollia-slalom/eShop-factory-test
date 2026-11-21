---
id: TC-ORDD-1-03
type: happy
layer: e2e
covers: ["Outputs: delivery address (street, city, state, country, zip code)", "AC1"]
priority: P1
---

# TC-ORDD-1-03: Details page shows the delivery address

## Why

- The story lists the five address fields on the details page; My orders shows none of them, so this is new data the page must fetch and map. Distinct values per field catch swapped fields. e2e because only the rendered page proves the shopper sees them.

## Preconditions

- Scenario `ordd-1`: bob's order 1 has Street `15703 NE 61st Ct`, City `Redmond`, State `WA`, Country `U.S.`, ZipCode `98052`.
- Signed in as bob (`bob` / `Pass123$`).

## Steps

1. Open `/user/orders/1`.

## Expected result

- Response status is 200.
- The `Delivery address` section shows: Street `15703 NE 61st Ct`, City `Redmond`, State `WA`, Country `U.S.`, Zip code `98052` (each value next to its label).
