---
id: TC-RANGE-1-11
type: happy
layer: e2e
covers: ["AC2: type Navigation shows Prices $59.99 – $299.00"]
priority: P1
---

# TC-RANGE-1-11: Choosing type Navigation shows "Prices $59.99 – $299.00"

## Why

- AC2 names this exact text for the Type filter, which the page passes to the facets call through a separate parameter from the brand; a page that forwarded only the brand would show the unfiltered range here.

## Preconditions

- Test stack up with the `default` scenario; anonymous visitor. Navigation has 11 products (two pages).

## Steps

1. Open `/`.
2. Click the "Navigation" link in the Type filter.

## Expected result

- The URL contains `type=7`.
- `.catalog-count` contains "11 products".
- `.catalog-price-range` has the text "Prices $59.99 – $299.00".
