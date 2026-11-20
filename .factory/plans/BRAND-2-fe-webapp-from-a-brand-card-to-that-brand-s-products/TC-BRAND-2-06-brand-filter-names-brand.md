---
id: TC-BRAND-2-06
type: happy
layer: e2e
covers: ["AC2: any catalog filtered to exactly one brand, reached through the Brand filter"]
priority: P2
---

# TC-BRAND-2-06: Choosing one brand in the catalog's Brand filter also names it in the header

## Why

- AC2's precondition is "the catalog is filtered to exactly one brand", not "came from a brand card". A header that only changes when the shopper arrives from the Brands page would break the rule for shoppers who use the filter. Gravitator is used so the name is not hard-coded from the Daybird cases. e2e because the filter is a navigation inside the catalog page.

## Preconditions

- Test stack running with scenario `default`. Brand 2 is "Gravitator". Anonymous visitor.

## Steps

1. Open `/` and confirm the page header title reads "Ready for a new adventure?".
2. Click the "Gravitator" tag in the Filters panel's Brand group.

## Expected result

- The browser is on path `/` with query `brand=2`.
- The page header title text is exactly "Brand: Gravitator".
- The page header subtitle contains the link "All brands" with `href` `/brands`.
