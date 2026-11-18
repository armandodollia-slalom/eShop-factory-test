---
id: TC-RANGE-1-10
type: happy
layer: e2e
covers: ["AC2: brand Daybird shows Prices $49.99 – $449.99"]
priority: P1
---

# TC-RANGE-1-10: Choosing brand Daybird shows "Prices $49.99 – $449.99"

## Why

- AC2 names this exact text for the Brand filter. Choosing the filter through its link checks the real user path: the page reloads with `brand=1` and the toolbar must follow it instead of keeping the unfiltered range.

## Preconditions

- Test stack up with the `default` scenario; anonymous visitor. Daybird has 10 products (two pages).

## Steps

1. Open `/`.
2. Click the "Daybird" link in the Brand filter.

## Expected result

- The URL contains `brand=1`.
- `.catalog-count` contains "10 products".
- `.catalog-price-range` has the text "Prices $49.99 – $449.99".
