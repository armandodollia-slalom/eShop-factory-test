---
id: TC-BUG-45-08
type: sad
sad-path: boundary
layer: e2e
covers: ["Bug Report: a brand or type value that is ... an empty value", "Expected: a value that is not a number is ignored", "Expected: links open the catalog page (HTTP 200, header, filters, product list)", "Expected: whole catalog \"101 products\" with \"All\" selected in the filter the bad value was given for"]
priority: P2
---

# TC-BUG-45-08: `/?type=` (empty value) shows the whole catalog with type "All" selected

## Why

- The Bug Report names an empty value for either `brand` or `type`, and `type` is bound separately from `brand`, so TC-05 alone would not catch a fix that guards only the empty brand. e2e because only the rendered WebApp page binds the query.

## Preconditions

- Test stack running with scenario `default` (101 catalog items).
- Anonymous visitor.

## Steps

1. Navigate the browser to `<WebApp base URL>/?type=`.

## Expected result

- The navigation response status is 200.
- The usual store header and the heading "Ready for a new adventure?" are visible.
- The brand and type filter groups are visible.
- `.catalog-count` reads exactly "101 products".
- The product list shows product cards (`.catalog-product` count is greater than 0).
- In the type filter group, the "All" option has the `active` class and no type option has it.
- In the brand filter group, the "All" option has the `active` class.
- No error page and no empty body are shown.
