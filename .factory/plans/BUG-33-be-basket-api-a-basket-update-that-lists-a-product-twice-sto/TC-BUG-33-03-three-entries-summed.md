---
id: TC-BUG-33-03
type: happy
layer: functional
covers: ["Expected: one line, with the quantities of its entries added up", "Bug report: a product listed more than once"]
priority: P2
---

# TC-BUG-33-03: Product listed three times (1 + 1 + 1) is stored as one line with quantity 3

## Why

- The bug says "more than once", not "twice": a fix that merged only the first pair would leave a second line for the third entry. Three entries of quantity 1 give the same total as the reported case, so the expected value is unambiguous. Functional for the same persistence reason as TC-BUG-33-01.

## Preconditions

- Same service wiring as TC-BUG-33-01.
- Buyer id `bug33-tc03-bob`; no basket stored for it; context user has claim `sub` = `bug33-tc03-bob`.

## Steps

1. Call `UpdateBasket` with `UpdateBasketRequest { items: [ { product_id: 1, quantity: 1 }, { product_id: 1, quantity: 1 }, { product_id: 1, quantity: 1 } ] }`.
2. Call `GetBasket` with `GetBasketRequest {}`.

## Expected result

- Step 2 returns exactly 1 item: `product_id` = 1, `quantity` = 3.
