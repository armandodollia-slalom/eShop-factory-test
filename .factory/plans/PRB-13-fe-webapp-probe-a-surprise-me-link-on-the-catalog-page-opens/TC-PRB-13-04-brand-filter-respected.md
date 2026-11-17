---
id: TC-PRB-13-04
type: happy
layer: e2e
covers: ["AC3: brand selected, product opened is one the filter lists"]
priority: P1
---

# TC-PRB-13-04: With a brand selected, every surprise product belongs to that brand

## Why

- AC3 requires the pick to respect the brand filter. A small brand makes the allowed set exact and checkable: brand XE lists 3 products, so any product outside them is a failure. Repeated clicks reduce the chance an unfiltered pick passes by luck (1 in 34 per click).

## Preconditions

- Test stack running with scenario `default`. Brand XE lists exactly 3 products: "Survivor 2-Person Tent", "Pathfinder GPS Watch", "Nomad 2-Person Tent". Anonymous shopper.

## Steps

1. Open the catalog page `/` and select the brand "XE" in the Brand filter (only XE active, no type).
2. Confirm the catalog shows "3 products".
3. Repeat 8 times: click "Surprise me", record the product page's heading, then go back to the XE-filtered catalog.

## Expected result

- The "Surprise me" link is visible on the XE-filtered catalog, and its `href` carries the XE brand id as `brand`.
- Each of the 8 clicks ends on an `/item/<id>` page whose heading is one of "Survivor 2-Person Tent", "Pathfinder GPS Watch", "Nomad 2-Person Tent".
- No click opens a product of another brand.
