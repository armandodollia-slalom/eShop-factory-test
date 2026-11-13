---
id: TC-CAT-1-11
type: happy
layer: e2e
covers: ["AC6", "Outputs: heading More from {brand}", "Outputs: up to four product cards with picture, name, price", "Outputs: section below the product details"]
priority: P1
---

# TC-CAT-1-11: A visitor sees "More from Brand Alpha" with four product cards on the product page

## Why

- AC6 for a not-signed-in shopper, the main user-visible behavior. It is e2e because the Test scope requires the section end to end in the browser (WebApp, CatalogService, Catalog.API). It checks the default count of four (the brand has six others), the exclusion of the item itself, and the card content.

## Preconditions

- Scenario `brand-mates` loaded on the test stack; browser not signed in.

## Steps

1. Open `/item/1001` (Aardvark Target).
2. Scroll below the product details.

## Expected result

- The product details of "Aardvark Target" are shown, and below them a section with the heading "More from Brand Alpha".
- The section contains exactly 4 product cards, in this order: "Bravo Pack", "Charlie Pack", "Delta Pack", "Echo Pack"; each shows a picture, the name and a price.
- No card is named "Aardvark Target" and none is from "Brand Beta".
