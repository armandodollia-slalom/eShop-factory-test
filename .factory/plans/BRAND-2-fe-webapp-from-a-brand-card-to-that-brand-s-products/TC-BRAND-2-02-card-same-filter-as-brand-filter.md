---
id: TC-BRAND-2-02
type: happy
layer: e2e
covers: ["AC1: the same filter as choosing the brand in the catalog's Brand filter"]
priority: P1
---

# TC-BRAND-2-02: The card applies the same filter as choosing the brand in the catalog's Brand filter

## Why

- AC1 says the card's result is "the same filter as choosing the brand in the catalog's Brand filter". A card that used another query parameter or another page would look filtered while differing from the filter (different count, filter tag not active, different URL to share). Comparing the two journeys guards that equivalence. e2e because both journeys are browser navigation.

## Preconditions

- Test stack running with scenario `default`. Brand 2 "Gravitator" has 11 items. Anonymous visitor.

## Steps

1. Open `/`, click the "Gravitator" tag in the Filters panel's Brand group, and record the resulting URL's path and query, the catalog toolbar text and the names of the products listed on page 1.
2. Open `/brands`, click the card whose heading is "Gravitator", and record the same three things.

## Expected result

- Both journeys end on path `/` with query `brand=2`.
- Both toolbars read "11 products".
- Both journeys list the same product names on page 1, in the same order.
- In both, the "Gravitator" tag in the Brand group has class `active`.
