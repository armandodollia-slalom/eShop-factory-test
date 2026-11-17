---
id: TC-PRB-13-03
type: happy
layer: e2e
covers: ["AC2: chosen at random each time"]
priority: P2
---

# TC-PRB-13-03: Repeated "Surprise me" clicks open different products

## Why

- AC2 requires a new random pick on each click. A regression that caches the pick, or always picks index 0, would still pass TC-PRB-13-02; this case catches it. It needs real navigation from the catalog page, so e2e.

## Preconditions

- Test stack running with scenario `default` (101 products). Anonymous shopper.

## Steps

1. Repeat 10 times: open the catalog page `/` with no filter, click "Surprise me", wait for the `/item/<id>` page, and record `<id>`.

## Expected result

- Every one of the 10 navigations ends on `/item/<id>` with `<id>` in 1–101.
- The 10 recorded ids contain at least 2 distinct values.
