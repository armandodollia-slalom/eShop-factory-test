---
id: TC-BRAND-2-08
type: happy
layer: e2e
covers: ["AC3: no brand filter shows the usual title and no \"All brands\" link"]
priority: P1
---

# TC-BRAND-2-08: Catalog without a brand filter shows the usual title and no "All brands" link

## Why

- AC3 keeps the existing header for the plain catalog. A change that always renders a brand section, or leaves the title empty when no brand is selected, would break the catalog's landing page. e2e because the header is rendered on the test stack's home page.

## Preconditions

- Test stack running with scenario `default`. Anonymous visitor.

## Steps

1. Open `/` and wait until the catalog toolbar reads "101 products".

## Expected result

- The page header title text is exactly "Ready for a new adventure?".
- The page header subtitle text is exactly "Start the season with the latest in clothing and equipment.".
- The page has no link with text "All brands".
- The page does not contain the text "Brand:".
