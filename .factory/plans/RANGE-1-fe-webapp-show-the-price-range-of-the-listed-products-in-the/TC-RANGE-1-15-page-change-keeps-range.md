---
id: TC-RANGE-1-15
type: happy
layer: e2e
covers: ["AC5: page change keeps the range of the whole selection", "AC2: across every page of results"]
priority: P1
---

# TC-RANGE-1-15: Moving to page 2 keeps the range of the whole selection

## Why

- AC5 and AC2 require the range to cover every page. Page 2 of the unfiltered catalog holds neither the cheapest nor the dearest product of page 1, so a range computed from the visible page would change here.

## Preconditions

- Test stack up with the `default` scenario; anonymous visitor. 101 products, 9 per page.

## Steps

1. Open `/`.
2. Click the "Next page" link of the pagination.

## Expected result

- The URL contains `page=2` and page 2 is marked as the current page.
- `.catalog-count` contains "101 products".
- `.catalog-price-range` has the text "Prices $21.99 – $699.00".
