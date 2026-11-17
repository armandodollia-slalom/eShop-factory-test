---
id: TC-PRB-13-08
type: happy
layer: e2e
covers: ["AC5: header, filters, product list, paging unchanged"]
priority: P2
---

# TC-PRB-13-08: The rest of the catalog page is unchanged

## Why

- AC5 guards against the new slot in the shared `CatalogSearch` component disturbing the rest of the page. It checks each named area (header, filters, product list, paging) against the seeded catalog's known values, on e2e because only the rendered page shows them together.

## Preconditions

- Test stack running with scenario `default` (101 products, 13 brands, 8 types). Anonymous shopper.

## Steps

1. Open the catalog page `/` with no filter.
2. Click page number "2" in the paging control.

## Expected result

- After step 1: the site header is shown with its logo and navigation; the filter panel shows the "Brand" group with "All" plus 13 brands and the "Type" group with "All" plus 8 types, "All" active in both, and no "Clear all filters" link; the count reads "101 products"; `.catalog-items` holds 9 product cards; the paging control shows page 1 as the current page and a link to page 2.
- After step 2: page 2 is the current page, 9 product cards are shown, and the "Surprise me" link is still shown in the filter panel.
- The filter panel contains exactly one link that is not a brand tag, a type tag or "Clear all filters": the "Surprise me" link.
