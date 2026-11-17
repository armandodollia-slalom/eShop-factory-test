---
id: TC-BUG-45-05
type: sad
sad-path: boundary
layer: e2e
covers: ["Steps to Reproduce 5", "Bug Report: an empty value", "Expected: steps 1-5 open the catalog page (HTTP 200, header, filters, product list)", "Expected: steps 1, 2 and 5 show \"101 products\" with \"All\" selected"]
priority: P1
---

# TC-BUG-45-05: `/?brand=` (empty value) shows the whole catalog with brand "All" selected

## Why

- The empty value is the edge of "not a number" that the ticket names explicitly (a truncated link); it is parsed differently from text (an empty string, not a word), so it gets its own case. e2e because only the rendered page binds the query.

## Preconditions

- Test stack running with scenario `default` (101 catalog items).
- Anonymous visitor.

## Steps

1. Navigate the browser to `<WebApp base URL>/?brand=`.

## Expected result

- The navigation response status is 200.
- The usual store header and the brand and type filter groups are visible.
- `.catalog-count` reads exactly "101 products".
- `.catalog-product` count is greater than 0.
- In the brand filter group, the "All" option has the `active` class and no brand option has it.
- In the type filter group, the "All" option has the `active` class.
- No error page and no empty body are shown.
