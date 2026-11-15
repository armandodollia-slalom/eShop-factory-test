---
id: TC-BUG-38-04
type: sad
sad-path: validation
layer: e2e
covers: ["Expected: a footer entry with no page to open does not change on hover", "Expected: pointer stays the default arrow"]
priority: P2
---

# TC-BUG-38-04: Every other footer entry with no page keeps its colour and the default cursor on hover

## Why

- The Expected rule applies to every footer entry without a page, not only the three named ones ("for example"). A per-entry override or a missed column would leave some placeholders lit. One sweep over the remaining entries checks the same behaviour without a case per entry. e2e because hover is browser-only.

## Preconditions

- Test stack running with scenario `bug-38` (extends `default`, adds no data); signed out.
- Browser viewport 1280×720.

## Steps

1. Open `/` and scroll the footer into view.
2. For each entry below, hover it, wait 500 ms, then read its computed `color` and `cursor`:
   - `nav[aria-label="Shop"]`: "Gift cards".
   - `nav[aria-label="Support"]`: "Shipping and returns", "Track an order", "Size guide", "Contact us".
   - `nav[aria-label="Company"]`: "Our story", "Careers", "Sustainability", "Store locator", "Press".
   - `ul[aria-label="Legal"]`: "Terms", "Cookies".

## Expected result

- None of the 12 entries has an `href` attribute.
- While hovered, each column entry (first 10) has `color` `rgba(255, 255, 255, 0.66)`.
- While hovered, "Terms" and "Cookies" each have `color` `rgba(255, 255, 255, 0.55)`.
- Each of the 12 entries has `cursor` `default`.
