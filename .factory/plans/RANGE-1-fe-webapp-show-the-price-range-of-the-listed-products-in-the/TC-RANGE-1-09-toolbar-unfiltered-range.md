---
id: TC-RANGE-1-09
type: happy
layer: e2e
covers: ["AC1: Prices $21.99 – $699.00 next to 101 products, in the toolbar's existing style"]
priority: P1
---

# TC-RANGE-1-09: Unfiltered catalog toolbar shows "101 products" and "Prices $21.99 – $699.00" in the count's style

## Why

- AC1 is the story's main visible outcome: the shopper sees the whole catalog's range next to the count, styled like it. Only the browser shows the formatting (dollar sign, two decimals, en dash) and the style. Page 1 alone spans $79.99 – $249.99, so this also proves the range is not taken from the visible page.

## Preconditions

- Test stack up with the `default` scenario; anonymous visitor.

## Steps

1. Open `/` (no query string).

## Expected result

- The `.catalog-count` paragraph contains the text "101 products".
- Inside that same paragraph, a `.catalog-price-range` element has the text "Prices $21.99 – $699.00" (en dash with a space on each side).
- The range element's computed `font-size`, `font-weight` and `color` equal those of the `.catalog-count` paragraph.
- The range appears after the count text in the paragraph.
