---
id: TC-PRB-19-02
type: happy
layer: e2e
covers: ["AC2: every product is removed", "AC2: page shows \"Your shopping bag is empty\""]
priority: P1
---

# TC-PRB-19-02: "Empty bag" removes every product and shows the empty-bag state

## Why

- AC2 is the story's core behaviour: one click removes every product, not just one. The bag has two different products, one with quantity 2, so a handler that removed only the first line or decremented a quantity would fail. The result is what the shopper sees, hence `e2e`.

## Preconditions

- Test stack running with scenario `default`; `alice`'s bag is empty.

## Steps

1. Sign in through the WebApp as `alice` / `Pass123$`.
2. Open `/item/99` and click "Add to shopping bag" twice.
3. Open `/item/1` and click "Add to shopping bag" once.
4. Open `/cart` and confirm it lists "Adventurer GPS Watch" (quantity 2) and "Wanderer Black Hiking Boots" (quantity 1).
5. Click the "Empty bag" button.

## Expected result

- The page stays on `/cart`.
- The heading "Your shopping bag is empty" is visible, with the "Start shopping" link.
- No product line (`.cart-item`) is on the page; neither "Adventurer GPS Watch" nor "Wanderer Black Hiking Boots" is shown.
- The summary box (`.cart-summary`), the "Check out" link and the "Empty bag" button are no longer on the page.
- No error page or error message is shown.
