---
id: TC-BUG-38-02
type: sad
sad-path: validation
layer: e2e
covers: ["Expected: entry with no page keeps its normal colour on hover", "Expected: pointer stays the default arrow", "Repro step 2: hover New arrivals"]
priority: P1
---

# TC-BUG-38-02: "New arrivals" keeps its colour and the default cursor on hover

## Why

- This is the exact defect in the report: "New arrivals" opens nothing but turned white on hover. It is the primary regression check for the column rule. The `validation` tag is the closest allowed category for "an entry that is not a real link must not present itself as one". Only a browser shows hover state, so e2e.

## Preconditions

- Test stack running with scenario `bug-38` (extends `default`, adds no data); signed out.
- Browser viewport 1280×720.

## Steps

1. Open `/` and scroll the footer into view.
2. Hover "Shop all" in `nav[aria-label="Shop"]` (so a highlight transition has just occurred elsewhere), then hover "New arrivals" in `nav[aria-label="Shop"]`.
3. Wait 500 ms with the mouse still on "New arrivals" (longer than the colour transition).

## Expected result

- "New arrivals" has no `href` attribute.
- While hovered, "New arrivals" has `color` `rgba(255, 255, 255, 0.66)` (same as at rest), not `rgb(255, 255, 255)`.
- "New arrivals" has `cursor` `default`.
