---
id: TC-PRB-6-02
type: happy
layer: e2e
covers: ["Expected: visible text ('Remove') unchanged"]
priority: P2
---

# TC-PRB-6-02: Remove button's visible text is still "Remove"

## Why

- The story explicitly requires the button's visible text to stay "Remove"; a fix that changes the visible label (or puts the long accessible name on screen) would break the line's layout and violate the contract. Visible text is only observable in the rendered page, so this runs e2e, separately from the accessible-name case because it checks a different property.

## Preconditions

- Test stack running with scenario `default`; `alice` (`Pass123$`) with an empty basket.

## Steps

1. Sign in as `alice` / `Pass123$`.
2. Add catalog item 1 "Wanderer Black Hiking Boots" to the shopping bag from `/item/1` ("Add to shopping bag").
3. Navigate to `/cart`.
4. Read the rendered inner text of the button named "Remove Wanderer Black Hiking Boots from your shopping bag".

## Expected result

- The button's visible inner text, trimmed, is exactly "Remove".
- The text "from your shopping bag" is not visible on the page inside the line (it exists only as the accessible name).
