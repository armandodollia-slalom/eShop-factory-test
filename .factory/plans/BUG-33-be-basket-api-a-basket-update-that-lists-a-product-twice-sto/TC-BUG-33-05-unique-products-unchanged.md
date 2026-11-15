---
id: TC-BUG-33-05
type: happy
layer: functional
covers: ["Expected: Updates that list each product once behave as they do today"]
priority: P1
---

# TC-BUG-33-05: Update listing each product once stores one line per entry with the given quantities

## Why

- The story requires that the fix does not change ordinary updates. A regression here (quantities altered, lines dropped) would break every add-to-bag in the WebApp. Functional to confirm the round trip through Redis is unchanged.

## Preconditions

- Same service wiring as TC-BUG-33-01.
- Buyer id `bug33-tc05-bob`; no basket stored for it; context user has claim `sub` = `bug33-tc05-bob`.

## Steps

1. Call `UpdateBasket` with `UpdateBasketRequest { items: [ { product_id: 1, quantity: 1 }, { product_id: 2, quantity: 4 } ] }`.
2. Call `GetBasket` with `GetBasketRequest {}`.

## Expected result

- Step 2 returns exactly 2 items.
- One item has `product_id` = 1 and `quantity` = 1.
- One item has `product_id` = 2 and `quantity` = 4.
