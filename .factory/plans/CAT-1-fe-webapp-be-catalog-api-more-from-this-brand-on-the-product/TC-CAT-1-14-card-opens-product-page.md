---
id: TC-CAT-1-14
type: happy
layer: e2e
covers: ["AC6: following a card opens that item's product page"]
priority: P1
---

# TC-CAT-1-14: Following a brand-mate card opens that item's product page

## Why

- AC6 second half: the link target of each card. Separate from TC-CAT-1-13 because it checks navigation, not rendering.

## Preconditions

- Scenario `brand-mates` loaded; the shopper is not signed in.

## Steps

1. Open `/item/203`.
2. Click the card "Bravo Tent" in the "More from Mates Co" section.

## Expected result

- The URL becomes `/item/202`.
- The product page shows the item name "Bravo Tent".
- The section "More from Mates Co" is shown, contains a "Charlie Tent" card and does not contain a "Bravo Tent" card.
