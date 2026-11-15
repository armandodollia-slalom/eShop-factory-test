---
id: TC-PRB-6-04
type: happy
layer: e2e
covers: ["Bug Report: each line's remove button is named 'Remove {product} from your shopping bag'"]
priority: P2
---

# TC-PRB-6-04: Each line's remove button names its own product with "from your shopping bag"

## Why

- The bug report says each line's remove button carries the name `Remove {product} from your …`; the fix must keep the product interpolation per line while changing the trailing wording. A hard-coded name for one product would pass TC-PRB-6-01 but fail here, so a second product is needed. Runs e2e for the same reason as TC-PRB-6-01.

## Preconditions

- Test stack running with scenario `default`; `alice` (`Pass123$`) with an empty basket; catalog item 1 "Wanderer Black Hiking Boots" and item 2 "Summit Pro Harness".

## Steps

1. Sign in as `alice` / `Pass123$`.
2. Add item 1 "Wanderer Black Hiking Boots" from `/item/1` ("Add to shopping bag").
3. Add item 2 "Summit Pro Harness" from `/item/2` ("Add to shopping bag").
4. Navigate to `/cart` and list the accessible names of all buttons with class `cart-remove`.

## Expected result

- `/cart` shows two lines.
- The remove buttons' accessible names are exactly, as a set: "Remove Wanderer Black Hiking Boots from your shopping bag" and "Remove Summit Pro Harness from your shopping bag".
- No remove button's accessible name ends with "from your bag".
