---
id: TC-PRB-13-01
type: happy
layer: e2e
covers: ["AC1: link \"Surprise me\" next to the brand and type filters"]
priority: P1
---

# TC-PRB-13-01: "Surprise me" link is shown in the filter panel of the unfiltered catalog

## Why

- AC1 requires a "Surprise me" link next to the brand and type filters. Its placement only exists in rendered markup of the WebApp, so this is an e2e case; it is separate from the click cases so a missing or misplaced link is reported on its own.

## Preconditions

- Test stack running with scenario `default` (101 products). Anonymous shopper (not signed in).

## Steps

1. Open the WebApp catalog page `/` with no query string.

## Expected result

- Exactly one link with accessible name "Surprise me" is visible on the page.
- The link is inside the filter panel (`aside.catalog-search`) and comes after the "Brand" and "Type" filter groups (headings "Brand" and "Type" precede it in document order).
- The link's `href` points to the `/surprise` route with no `brand` or `type` query parameter.
