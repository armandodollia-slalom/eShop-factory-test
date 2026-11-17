---
id: TC-BUG-45-01
type: sad
sad-path: validation
layer: e2e
covers: ["Steps to Reproduce 1", "Expected: steps 1-5 open the catalog page (HTTP 200, header, filters, product list)", "Expected: steps 1, 2 and 5 show \"101 products\" with \"All\" selected"]
priority: P1
---

# TC-BUG-45-01: `/?brand=abc` shows the whole catalog with brand "All" selected

## Why

- Step 1 of the bug is the plainest form of the defect: a single non-numeric `brand` value made the page answer HTTP 500 with an empty body. The fix lives in the WebApp page's query binding, which only the rendered page on the test stack exercises, so this is e2e.

## Preconditions

- Test stack running with scenario `default` (101 catalog items; 13 brands; 8 types).
- Anonymous visitor (not signed in).

## Steps

1. Navigate the browser to `<WebApp base URL>/?brand=abc`.

## Expected result

- The navigation response status is 200.
- The usual store header and the catalog hero heading "Ready for a new adventure?" are visible.
- The brand and type filter groups are visible.
- The count line `.catalog-count` reads exactly "101 products".
- The product list shows product cards (`.catalog-product` count is greater than 0).
- In the brand filter group, the "All" option has the `active` class and no brand option has it.
- In the type filter group, the "All" option has the `active` class.
- No error page and no empty body are shown.
