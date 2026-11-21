---
id: TC-BUG-41-04
type: happy
layer: e2e
covers: ["Expected: the shopping bag is emptied after the order, as today (single click)"]
priority: P2
---

# TC-BUG-41-04: After a single click on Place order the shopping bag is empty

## Why

- The story keeps "bag emptied after the order" for the normal flow; a change to the checkout form must not stop `BasketState.CheckoutAsync` from clearing the basket. Separate from TC-BUG-41-03 because it is a different observable (basket vs. orders); e2e because the flow starts in the WebApp.

## Preconditions

- Test stack running with scenario `default`: user `alice` has an empty shopping bag and no orders.

## Steps

1. Sign in to the WebApp as `alice` / `Pass123$`.
2. Add "Alpine Peak Down Jacket" (item 28) to the shopping bag.
3. Open the shopping bag and click **Check out**.
4. Click **Place order** once and wait for `/user/orders` to load.
5. Open the shopping bag (`/cart`).

## Expected result

- The shopping bag page shows no items ("Alpine Peak Down Jacket" is not listed).
- The header's shopping bag badge shows no item count.
