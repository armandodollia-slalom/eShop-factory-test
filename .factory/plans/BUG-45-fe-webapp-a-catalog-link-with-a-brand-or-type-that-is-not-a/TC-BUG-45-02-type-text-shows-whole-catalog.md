---
id: TC-BUG-45-02
type: sad
sad-path: validation
layer: e2e
covers: ["Steps to Reproduce 2", "Expected: steps 1-5 open the catalog page (HTTP 200, header, filters, product list)", "Expected: steps 1, 2 and 5 show \"101 products\" with \"All\" selected"]
priority: P1
---

# TC-BUG-45-02: `/?type=abc` shows the whole catalog with type "All" selected

## Why

- Step 2 of the bug: `type` is bound separately from `brand`, so a fix to one could miss the other. A separate case proves the `type` parameter is guarded too. e2e because only the rendered WebApp page binds the query.

## Preconditions

- Test stack running with scenario `default` (101 catalog items).
- Anonymous visitor.

## Steps

1. Navigate the browser to `<WebApp base URL>/?type=abc`.

## Expected result

- The navigation response status is 200.
- The usual store header and the heading "Ready for a new adventure?" are visible.
- The brand and type filter groups are visible.
- `.catalog-count` reads exactly "101 products".
- `.catalog-product` count is greater than 0.
- In the type filter group, the "All" option has the `active` class and no type option has it.
- In the brand filter group, the "All" option has the `active` class.
- No error page and no empty body are shown.
