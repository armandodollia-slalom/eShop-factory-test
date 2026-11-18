---
id: TC-PRB-19-03
type: happy
layer: e2e
covers: ["AC3: after reload the bag is still empty (emptied on the server)"]
priority: P1
---

# TC-PRB-19-03: Emptied bag is still empty after a page reload

## Why

- AC3 guards against a client-only clear: the page could show the empty state while the Basket service still holds the products. A full reload re-reads the basket from the server, so it is the observable proof of the server-side delete. Only a browser reload on the real stack shows it, hence `e2e` rather than a unit test of `BasketState`.

## Preconditions

- Test stack running with scenario `default`; `alice`'s bag is empty.

## Steps

1. Sign in through the WebApp as `alice` / `Pass123$`.
2. Open `/item/99` and click "Add to shopping bag" once; open `/item/1` and click "Add to shopping bag" once.
3. Open `/cart` and click "Empty bag"; wait for "Your shopping bag is empty".
4. Reload the page (`page.reload()`).

## Expected result

- After the reload the page is `/cart` and shows the heading "Your shopping bag is empty".
- No product line (`.cart-item`) is on the page; "Adventurer GPS Watch" and "Wanderer Black Hiking Boots" are not shown.
- No "Empty bag" button is on the page.
