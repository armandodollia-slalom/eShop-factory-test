---
id: TC-PRB-19-07
type: happy
layer: e2e
covers: ["AC5: product lines unchanged", "AC5: quantity controls (Remove) unchanged"]
priority: P2
---

# TC-PRB-19-07: Removing one product still removes only that line

## Why

- The story's motivation contrasts "Empty bag" with removing products one by one, and AC5 keeps that per-line removal unchanged. Removing one line must not empty the whole bag, and the "Empty bag" button must remain while a product is left. Separate from TC-PRB-19-06 because "Remove" posts quantity 0 and exercises a different path. Hence `e2e`.

## Preconditions

- Test stack running with scenario `default`; `alice`'s bag is empty.

## Steps

1. Sign in through the WebApp as `alice` / `Pass123$`.
2. Open `/item/99` and click "Add to shopping bag" once; open `/item/1` and click "Add to shopping bag" once.
3. Open `/cart`.
4. Click "Remove Wanderer Black Hiking Boots from your bag".

## Expected result

- Exactly one product line remains: "Adventurer GPS Watch", quantity `1`, line total "$199.99".
- "Wanderer Black Hiking Boots" is no longer shown.
- The summary badge shows `1` and "Total" shows "$199.99".
- The "Empty bag" button is still present; "Your shopping bag is empty" is not shown.
