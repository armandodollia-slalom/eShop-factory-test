---
id: TC-PRB-6-05
type: sad
sad-path: boundary
layer: e2e
covers: ["Expected: what the remove button does is unchanged", "Bug Report: each line's remove button names its own product"]
priority: P1
---

# TC-PRB-6-05: The remove button named for one product does not remove the other line

## Why

- The accessible name promises `Remove {product} from your shopping bag`, so the button must act only on the line whose product it names; a fix that rewires the button's form or `name`/`value` pair could remove the wrong line or every line while the single-line case TC-PRB-6-03 still passes. This is the boundary between two adjacent lines, which only the rendered page and the Basket service together can show, so it runs e2e.

## Preconditions

- Test stack running with scenario `default`; `alice` (`Pass123$`) with an empty basket; catalog item 1 "Wanderer Black Hiking Boots" and item 2 "Summit Pro Harness".

## Steps

1. Sign in as `alice` / `Pass123$`.
2. Add item 1 "Wanderer Black Hiking Boots" from `/item/1` ("Add to shopping bag").
3. Add item 2 "Summit Pro Harness" from `/item/2` ("Add to shopping bag").
4. Navigate to `/cart` and click the button named "Remove Summit Pro Harness from your shopping bag".
5. Reload `/cart`.

## Expected result

- After step 4 and after step 5, `/cart` shows exactly one line, "Wanderer Black Hiking Boots".
- After step 5 exactly one button named "Remove Wanderer Black Hiking Boots from your shopping bag" is present, and no button named "Remove Summit Pro Harness from your shopping bag" exists.
- The heading "Your shopping bag is empty" is not shown.
