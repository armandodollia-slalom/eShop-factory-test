---
id: TC-BUG-33-04
type: happy
layer: functional
covers: ["Expected: one line per product, quantities summed", "Expected: Updates that list each product once behave as they do today"]
priority: P1
---

# TC-BUG-33-04: Duplicated product merges while another product listed once keeps its own line

## Why

- A real basket mixes products. A merge keyed wrongly (for example collapsing all entries, or dropping the product between the duplicates) would corrupt the other line. This checks the duplicated product is summed and the product listed once is stored unchanged in the same update.

## Preconditions

- Same service wiring as TC-BUG-33-01.
- Buyer id `bug33-tc04-bob`; no basket stored for it; context user has claim `sub` = `bug33-tc04-bob`.

## Steps

1. Call `UpdateBasket` with `UpdateBasketRequest { items: [ { product_id: 1, quantity: 1 }, { product_id: 2, quantity: 4 }, { product_id: 1, quantity: 2 } ] }`.
2. Call `GetBasket` with `GetBasketRequest {}`.

## Expected result

- Step 2 returns exactly 2 items.
- One item has `product_id` = 1 and `quantity` = 3.
- One item has `product_id` = 2 and `quantity` = 4.
