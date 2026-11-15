---
id: TC-BUG-38-03
type: sad
sad-path: validation
layer: e2e
covers: ["Expected: entry with no page keeps its normal colour on hover", "Expected: pointer stays the default arrow", "Repro step 2: hover Privacy"]
priority: P1
---

# TC-BUG-38-03: "Privacy" keeps its colour and the default cursor on hover

## Why

- "Privacy" lives in the bottom legal bar, which has its own CSS rule (`.eshop-footer-legal`) separate from the columns; fixing only the column rule would leave this entry lighting up. The ticket names it in step 2, so it gets its own case. e2e because hover is browser-only.

## Preconditions

- Test stack running with scenario `bug-38` (extends `default`, adds no data); signed out.
- Browser viewport 1280×720.

## Steps

1. Open `/` and scroll the footer into view.
2. Hover "Privacy" in `ul.eshop-footer-legal[aria-label="Legal"]`.
3. Wait 500 ms with the mouse still on "Privacy".

## Expected result

- "Privacy" has no `href` attribute.
- While hovered, "Privacy" has `color` `rgba(255, 255, 255, 0.55)` (same as at rest), not `rgb(255, 255, 255)`.
- "Privacy" has `cursor` `default`.
