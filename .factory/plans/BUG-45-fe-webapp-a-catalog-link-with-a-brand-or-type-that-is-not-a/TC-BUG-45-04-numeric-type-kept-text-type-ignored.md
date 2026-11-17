---
id: TC-BUG-45-04
type: sad
sad-path: validation
layer: e2e
covers: ["Steps to Reproduce 4", "Expected: steps 1-5 open the catalog page (HTTP 200, header, filters, product list)", "Expected: a value that is not a number is ignored, and the other values still apply", "Expected: step 4 shows the Navigation products, Navigation selected, \"11 products\", the same as /?type=7"]
priority: P1
---

# TC-BUG-45-04: `/?type=7&type=x` ignores "x" and shows the 11 Navigation products

## Why

- Same rule as TC-03 for the `type` parameter, which is bound on its own: a numeric type must still filter when a non-numeric one sits beside it. e2e for the same reason as the other cases.

## Preconditions

- Test stack running with scenario `default`; type id 7 is "Navigation" and has exactly 11 catalog items.
- Anonymous visitor.

## Steps

1. Navigate the browser to `<WebApp base URL>/?type=7&type=x`.

## Expected result

- The navigation response status is 200.
- The usual store header and the brand and type filter groups are visible.
- `.catalog-count` reads exactly "11 products".
- The product list shows product cards (`.catalog-product` count is greater than 0).
- In the type filter group, the "Navigation" option has the `active` class and the "All" option does not.
- No other type option has the `active` class.
- In the brand filter group, the "All" option has the `active` class.
- No error page and no empty body are shown.
