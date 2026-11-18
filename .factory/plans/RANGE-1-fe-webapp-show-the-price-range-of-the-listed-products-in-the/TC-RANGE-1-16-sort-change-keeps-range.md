---
id: TC-RANGE-1-16
type: happy
layer: e2e
covers: ["AC5: sort change keeps the range of the whole selection"]
priority: P1
---

# TC-RANGE-1-16: Changing the sort order keeps the range of the whole selection

## Why

- AC5 requires the range to stay that of the whole selection when the sort changes. The sort runs on the client and only reorders the cards of the current page, so the unfiltered catalog is used: its page 1 spans only $79.99 – $249.99, while the whole selection spans $21.99 – $699.00. A range taken from the visible cards would show the narrower range and fail this case. Brand Daybird and type Navigation cannot discriminate here because their page 1 already holds their cheapest and dearest products. It is e2e because the sort only exists in the browser.

## Preconditions

- Test stack up with the `default` scenario (101 items, lowest price $21.99, highest $699.00); anonymous visitor.

## Steps

1. Open `/` (no filter).
2. Open the "Sort" combobox and choose "Price: High to Low".

## Expected result

- The sort control shows "Price: High to Low" and the first product card shows $249.99.
- `.catalog-count` contains "101 products".
- `.catalog-price-range` has the text "Prices $21.99 – $699.00"; it does not show "$79.99" or "$249.99".
