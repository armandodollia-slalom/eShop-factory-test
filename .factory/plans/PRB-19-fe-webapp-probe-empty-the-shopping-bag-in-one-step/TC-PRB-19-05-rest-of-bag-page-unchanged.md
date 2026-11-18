---
id: TC-PRB-19-05
type: happy
layer: e2e
covers: ["AC5: product lines, quantity controls, totals, \"Check out\" and \"Continue shopping\" unchanged"]
priority: P1
---

# TC-PRB-19-05: Product lines, quantity controls, totals, "Check out" and "Continue shopping" are unchanged

## Why

- AC5 requires that adding the button changes nothing else on the bag page. This case checks every listed element with exact values on a two-product bag, so a markup change that drops a control or breaks a total is caught. It is a rendered-page check, hence `e2e`.

## Preconditions

- Test stack running with scenario `default`; `alice`'s bag is empty.

## Steps

1. Sign in through the WebApp as `alice` / `Pass123$`.
2. Open `/item/99` and click "Add to shopping bag" twice; open `/item/1` and click "Add to shopping bag" once.
3. Open `/cart`.

## Expected result

- Two product lines (`.cart-item`): "Adventurer GPS Watch" with unit price "$199.99", quantity input value `2`, line total "$399.98"; "Wanderer Black Hiking Boots" with unit price "$109.99", quantity input value `1`, line total "$109.99".
- Each line has the quantity controls, named after its product (shown here for the watch; the boots line has the same four with "Wanderer Black Hiking Boots"): "Decrease quantity of Adventurer GPS Watch", "Quantity of Adventurer GPS Watch" input, "Increase quantity of Adventurer GPS Watch" and "Remove Adventurer GPS Watch from your bag". "Decrease quantity of Wanderer Black Hiking Boots" is disabled (quantity 1); "Decrease quantity of Adventurer GPS Watch" is enabled.
- The summary box shows "Your shopping bag" with badge `3` and "Total" "$509.97".
- The "Check out" link is visible with `href="checkout"`; the "Continue shopping" link is visible.
- The "Empty bag" button is present in addition to these, and the summary box has no other new controls.
