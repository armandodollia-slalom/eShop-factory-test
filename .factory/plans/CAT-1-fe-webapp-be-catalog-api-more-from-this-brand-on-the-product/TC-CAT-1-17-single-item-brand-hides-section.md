---
id: TC-CAT-1-17
type: sad
sad-path: boundary
layer: e2e
covers: ["AC7", "Outputs: no items hides the section, heading included"]
priority: P1
---

# TC-CAT-1-17: Single-item brand shows no "More from" section and the rest of the page is intact

## Why

- AC7: an empty result must hide the heading too, and the page must otherwise still render. Needs the browser because the risk is an orphan heading or a broken page.

## Preconditions

- Scenario `brand-mates` loaded; item 210 "Lone Lantern" is the only item of brand 21.

## Steps

1. Open `/item/210`.

## Expected result

- The product details for "Lone Lantern" are shown (name and price).
- No element with text starting "More from" exists on the page.
- No product cards are rendered below the product details.
