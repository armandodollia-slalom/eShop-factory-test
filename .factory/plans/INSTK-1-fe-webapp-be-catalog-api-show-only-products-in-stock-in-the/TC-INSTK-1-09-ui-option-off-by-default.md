---
id: TC-INSTK-1-09
type: happy
layer: e2e
covers: ["AC1: an 'In stock only' option next to the Brand and Type filters, off by default"]
priority: P1
---

# TC-INSTK-1-09: Catalog shows an "In stock only" option, off by default

## Why

- AC1 is visible UI only: where the option sits and that it starts off. Only the WebApp on the test stack renders the filter panel, so this is e2e.

## Preconditions

- Test stack running scenario `instk-1` (INSTK-1 stock set, 101 items, 11 out of stock).
- Anonymous shopper.

## Steps

1. Open `/` (no query string).

## Expected result

- The filter panel shows the Brand and Type filter groups and, in the same panel, an "In stock only" option.
- "In stock only" is not in its active state (it does not carry the `active` styling the selected Brand/Type tags carry).
- The address bar has no `inStock` parameter.
- The toolbar reads "101 products" and the pager's last page number is 12.
- The filter panel shows no active-filter count and no "Clear all filters" link.
