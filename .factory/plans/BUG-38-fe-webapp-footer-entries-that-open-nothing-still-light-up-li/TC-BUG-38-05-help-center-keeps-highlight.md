---
id: TC-BUG-38-05
type: happy
layer: e2e
covers: ["Expected: Help center keeps its hover highlight as today"]
priority: P1
---

# TC-BUG-38-05: "Help center" turns white on hover and keeps the default cursor

## Why

- "Help center" is the explicit exception: it has no page to open yet must keep its highlight. A fix that keys only on `href` would wrongly remove it, so it needs its own case. The default cursor is today's behaviour (see Open questions). e2e because hover is browser-only.

## Preconditions

- Test stack running with scenario `default`; signed out.
- Browser viewport 1280×720.

## Steps

1. Open `/` and scroll the footer into view.
2. Read the computed `color` of "Help center" in `nav[aria-label="Support"]` with the mouse away from the footer.
3. Hover "Help center".

## Expected result

- Before hover, "Help center" has `color` `rgba(255, 255, 255, 0.66)`.
- While hovered, "Help center" has `color` `rgb(255, 255, 255)`.
- "Help center" has `cursor` `default`.
- "Help center" is the first entry of the Support column and its text is exactly `Help center`.
