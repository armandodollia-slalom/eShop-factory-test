---
id: TC-BUG-45-06
type: happy
layer: e2e
covers: ["Steps to Reproduce 6", "Expected: links with only numeric values work exactly as today", "Actual: step 6 shows \"10 products\""]
priority: P1
---

# TC-BUG-45-06: `/?brand=1` still shows Daybird's 10 products

## Why

- The fix changes how `brand` is bound (strings parsed to ids); this guards that a purely numeric brand link still filters exactly as before. It is also the reference TC-03 is compared against. e2e on the rendered page.

## Preconditions

- Test stack running with scenario `default`; brand id 1 is "Daybird" with exactly 10 catalog items.
- Anonymous visitor.

## Steps

1. Navigate the browser to `<WebApp base URL>/?brand=1`.

## Expected result

- The navigation response status is 200.
- `.catalog-count` reads exactly "10 products".
- In the brand filter group, only the "Daybird" option has the `active` class; "All" does not.
- In the type filter group, the "All" option has the `active` class.
