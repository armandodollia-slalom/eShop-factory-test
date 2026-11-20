---
id: TC-GIFT-1-10
type: happy
layer: e2e
covers: ["Implementation Notes: placing an order is unchanged"]
priority: P2
---

# TC-GIFT-1-10: Placing an order from a bag with a gift message still creates the order

## Why

- The notes require checkout to stay unchanged; a new field on the basket item could break the order request the WebApp builds from the bag. A created order is only reachable on the test stack (the Ordering functional host cannot save one), so e2e.

## Preconditions

- Scenario `default` (card types from `_base`); `alice` has an empty basket and no orders.

## Steps

1. Sign in as `alice`, add item 99 ("Adventurer GPS Watch") to the bag, open `/cart`, choose "Add a gift message", type `Happy birthday, Sam!` and save.
2. Check out from the bag, filling the checkout form with the valid address and card details the existing checkout specs use, and place the order.
3. Open the orders page `/user/orders`.

## Expected result

- The order is placed without an error and the shopper is taken to the orders page.
- `/user/orders` lists exactly one order for `alice`, with a total equal to the price of one "Adventurer GPS Watch".
- After the order the bag at `/cart` is empty.
