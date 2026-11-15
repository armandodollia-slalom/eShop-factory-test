---
id: TC-PRB-6-03
type: happy
layer: e2e
covers: ["Expected: what the remove button does is unchanged"]
priority: P1
---

# TC-PRB-6-03: Activating the remove button still removes the line from the shopping bag

## Why

- The story requires the button's behaviour to be unchanged: it submits the line's form with quantity 0 and the line disappears. Editing the button's markup risks breaking its `name`/`value` submit pair; the effect spans the WebApp form handler and the Basket service, so it is checked end to end through the UI.

## Preconditions

- Test stack running with scenario `default`; `alice` (`Pass123$`) with an empty basket.

## Steps

1. Sign in as `alice` / `Pass123$`.
2. Add catalog item 1 "Wanderer Black Hiking Boots" to the shopping bag from `/item/1` ("Add to shopping bag").
3. Navigate to `/cart` and confirm the "Wanderer Black Hiking Boots" line is shown.
4. Click the button named "Remove Wanderer Black Hiking Boots from your shopping bag".
5. Reload `/cart`.

## Expected result

- After step 4 the "Wanderer Black Hiking Boots" line is no longer shown on `/cart`, and no button named "Remove Wanderer Black Hiking Boots from your shopping bag" remains.
- After step 5 the line is still absent (the removal persisted in alice's basket) and the page shows the heading "Your shopping bag is empty".
- After step 5 no header link with the accessible name "Shopping bag, 1 item" exists.
