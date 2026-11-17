---
id: TC-BUG-45-03
type: sad
sad-path: validation
layer: e2e
covers: ["Steps to Reproduce 3", "Expected: steps 1-5 open the catalog page (HTTP 200, header, filters, product list)", "Expected: a value that is not a number is ignored, and the other values still apply", "Expected: step 3 shows Daybird's products, Daybird selected, \"10 products\", the same as step 6"]
priority: P1
---

# TC-BUG-45-03: `/?brand=1&brand=abc` ignores "abc" and shows Daybird's 10 products

## Why

- The ticket requires more than "no crash": the remaining numeric values must still filter. A fix that dropped the whole `brand` parameter on any bad value would pass TC-01 but fail here (it would show 101 products). e2e because the multi-value query binding only runs in the rendered page.

## Preconditions

- Test stack running with scenario `default`; brand id 1 is "Daybird" and has exactly 10 catalog items.
- Anonymous visitor.

## Steps

1. Navigate the browser to `<WebApp base URL>/?brand=1&brand=abc`.

## Expected result

- The navigation response status is 200.
- The usual store header and the brand and type filter groups are visible.
- `.catalog-count` reads exactly "10 products".
- The product list shows product cards (`.catalog-product` count is greater than 0).
- In the brand filter group, the "Daybird" option has the `active` class and the "All" option does not.
- No other brand option has the `active` class.
- In the type filter group, the "All" option has the `active` class.
- No error page and no empty body are shown.
