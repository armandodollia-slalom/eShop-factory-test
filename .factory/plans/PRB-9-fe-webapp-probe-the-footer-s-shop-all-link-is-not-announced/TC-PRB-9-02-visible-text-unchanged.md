---
id: TC-PRB-9-02
type: happy
layer: e2e
covers: ["Expected: Its visible text (\"Shop all\") is unchanged"]
priority: P1
---

# TC-PRB-9-02: Footer "Shop all" link's visible text is unchanged

## Why

- The story requires the fix to change only what is announced, not what sighted and voice-control users see; a fix that replaced the visible text would break that. It is a separate case from the accessible name because the two are independent properties (aria-label overrides the name without touching the text). Only the rendered page shows the visible text, so e2e.

## Preconditions

- Test stack running (`factory teststack up`) with scenario `default`.
- Anonymous visitor (no sign-in).

## Steps

1. Open the WebApp home page `/`.
2. In the navigation landmark named "Shop", locate the link with accessible name "Shop all products".
3. Read its rendered inner text and check that it is visible.

## Expected result

- The link is visible.
- Its inner text, trimmed, is exactly "Shop all".
- The text "Shop all products" is not rendered as visible text anywhere inside the Shop navigation.
