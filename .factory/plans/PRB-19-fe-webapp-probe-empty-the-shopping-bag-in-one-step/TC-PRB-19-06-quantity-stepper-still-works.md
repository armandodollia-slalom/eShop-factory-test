---
id: TC-PRB-19-06
type: happy
layer: e2e
covers: ["AC5: quantity controls unchanged", "AC5: totals unchanged"]
priority: P2
---

# TC-PRB-19-06: Quantity stepper still updates a line and the totals

## Why

- AC5 keeps the quantity controls working. The new "Empty bag" form is a second enhanced form posted to the same page (`_handler=empty-cart` beside `update-cart`); a handler mix-up would make a quantity click empty the bag or do nothing. Clicking the stepper on the real page is the only way to prove the handlers stay separate, hence `e2e`.

## Preconditions

- Test stack running with scenario `default`; `alice`'s bag is empty.

## Steps

1. Sign in through the WebApp as `alice` / `Pass123$`.
2. Open `/item/99` and click "Add to shopping bag" once; open `/item/1` and click "Add to shopping bag" once.
3. Open `/cart`.
4. Click "Increase quantity of Adventurer GPS Watch".

## Expected result

- "Quantity of Adventurer GPS Watch" shows `2` and its line total is "$399.98".
- "Wanderer Black Hiking Boots" still shows quantity `1` and line total "$109.99".
- The summary badge shows `3` and "Total" shows "$509.97".
- Both product lines are still present and the "Empty bag" button is still present (the bag was not emptied).
