---
id: TC-BRAND-2-01
type: happy
layer: e2e
covers: ["AC1: selecting a brand's card opens the catalog filtered to that brand"]
priority: P1
---

# TC-BRAND-2-01: Selecting a brand's card opens the catalog filtered to that brand

## Why

- AC1 is the core of the story. If the card is not a link, or links to the unfiltered catalog, the shopper never reaches the brand's products. e2e because the link lives on a Blazor page and the filter is applied by the catalog page from the URL.

## Preconditions

- Test stack running with scenario `default`. Brand 1 "Daybird" has 10 items. Anonymous visitor.

## Steps

1. Open `/brands`.
2. Click the card whose heading is "Daybird".

## Expected result

- The browser is on path `/` with query `brand=1` (exactly one `brand` value, `1`).
- The catalog toolbar reads "10 products".
- In the Filters panel's Brand group, the "Daybird" tag has class `active` and the "All" tag does not.
- No other brand tag in the Brand group has class `active`.
