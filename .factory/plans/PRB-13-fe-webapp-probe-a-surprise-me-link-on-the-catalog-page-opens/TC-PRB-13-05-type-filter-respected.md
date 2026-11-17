---
id: TC-PRB-13-05
type: happy
layer: e2e
covers: ["AC3: type selected, product opened is one the filter lists"]
priority: P1
---

# TC-PRB-13-05: With a type selected, every surprise product is one the filtered list shows

## Why

- AC3 covers a type filter on its own ("brand and/or type"). Type Cycling lists 9 products, which fit exactly on one catalog page, so the test can compare the opened product against the names the page itself lists.

## Preconditions

- Test stack running with scenario `default`. Type Cycling lists exactly 9 products (one page of 9). Anonymous shopper.

## Steps

1. Open the catalog page `/` and select the type "Cycling" in the Type filter (only Cycling active, no brand).
2. Confirm the catalog shows "9 products" and record the 9 product names listed.
3. Repeat 8 times: click "Surprise me", record the product page's heading, then go back to the Cycling-filtered catalog.

## Expected result

- The "Surprise me" link's `href` carries the Cycling type id as `type`.
- Each of the 8 clicks ends on an `/item/<id>` page whose heading is one of the 9 names recorded in step 2.
