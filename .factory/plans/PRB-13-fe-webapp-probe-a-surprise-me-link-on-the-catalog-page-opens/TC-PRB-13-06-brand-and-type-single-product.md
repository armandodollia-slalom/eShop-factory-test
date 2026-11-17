---
id: TC-PRB-13-06
type: happy
layer: e2e
covers: ["AC3: brand and type selected", "AC4 boundary: filters listing exactly one product still show the link"]
priority: P1
---

# TC-PRB-13-06: With brand and type selected that list one product, "Surprise me" always opens that product

## Why

- AC3 covers brand and type together; a combination listing a single product makes the expected result deterministic. It is also the just-inside boundary of AC4 (one product: the link must still be shown), opposite TC-PRB-13-07.

## Preconditions

- Test stack running with scenario `default`. Brand XE + type Navigation lists exactly one product: "Pathfinder GPS Watch". Anonymous shopper.

## Steps

1. Open the catalog page `/`, select brand "XE" and type "Navigation".
2. Confirm the catalog shows "1 product".
3. Repeat 3 times: click "Surprise me", record the URL and heading, then go back to the filtered catalog.

## Expected result

- The "Surprise me" link is visible with 1 product listed.
- All 3 clicks end on the same `/item/<id>` page, whose heading is "Pathfinder GPS Watch".
