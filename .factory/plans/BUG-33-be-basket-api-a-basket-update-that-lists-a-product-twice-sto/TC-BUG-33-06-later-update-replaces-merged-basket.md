---
id: TC-BUG-33-06
type: happy
layer: functional
covers: ["Expected: quantities of its entries added up (entries of one update)", "Expected: Updates that list each product once behave as they do today (update replaces the stored basket)"]
priority: P2
---

# TC-BUG-33-06: A later update replaces the merged basket instead of adding to it

## Why

- The story sums the entries of one update; today an update replaces the whole stored basket. A fix that summed new entries into the stored lines would turn every quantity change in the WebApp into an increase. Functional because the risk only shows with a basket already stored in Redis.

## Preconditions

- Same service wiring as TC-BUG-33-01.
- Buyer id `bug33-tc06-bob`; no basket stored for it; context user has claim `sub` = `bug33-tc06-bob`.

## Steps

1. Call `UpdateBasket` with `UpdateBasketRequest { items: [ { product_id: 1, quantity: 1 }, { product_id: 1, quantity: 2 } ] }`.
2. Call `UpdateBasket` with `UpdateBasketRequest { items: [ { product_id: 1, quantity: 5 } ] }`.
3. Call `GetBasket` with `GetBasketRequest {}`.

## Expected result

- Step 3 returns exactly 1 item: `product_id` = 1, `quantity` = 5.
