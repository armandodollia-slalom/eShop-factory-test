---
id: TC-CAT-1-13
type: happy
layer: e2e
covers: ["AC6", "Outputs: heading More from {brand}", "Outputs: up to four product cards (picture, name, price)"]
priority: P1
---

# TC-CAT-1-13: Anonymous shopper sees "More from Mates Co" with four cards of other items

## Why

- AC6 end to end: the heading, the default count of four, the exclusion of the viewed item and the card content can only be verified in the browser through the WebApp-to-Catalog wiring. Anonymous covers the "not signed in" half of the criterion.

## Preconditions

- Scenario `brand-mates` loaded; the shopper is not signed in.

## Steps

1. Open `/item/203` in the WebApp.
2. Wait for the product details ("Charlie Tent") to be visible.

## Expected result

- Below the product details there is a section with the heading text exactly "More from Mates Co".
- The section contains exactly 4 product cards, in order: "Alpha Tent", "Bravo Tent", "Delta Tent", "Echo Tent".
- Each card shows a picture, its name and its price.
- No card is "Charlie Tent".
- The product details above still show "Charlie Tent".
