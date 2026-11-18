---
id: TC-BUG-45-07
type: happy
layer: e2e
covers: ["Expected: step 4 \"the same as /?type=7\"", "Expected: links with only numeric values work exactly as today"]
priority: P2
---

# TC-BUG-45-07: `/?type=7` still shows the 11 Navigation products

## Why

- The `type` binding changed the same way as `brand`; this guards that a purely numeric type link still filters as before and is the reference TC-04 is compared against. e2e on the rendered page.

## Preconditions

- Test stack running with scenario `default`; type id 7 is "Navigation" with exactly 11 catalog items.
- Anonymous visitor.

## Steps

1. Navigate the browser to `<WebApp base URL>/?type=7`.

## Expected result

- The navigation response status is 200.
- `.catalog-count` reads exactly "11 products".
- In the type filter group, only the "Navigation" option has the `active` class; "All" does not.
- In the brand filter group, the "All" option has the `active` class.
