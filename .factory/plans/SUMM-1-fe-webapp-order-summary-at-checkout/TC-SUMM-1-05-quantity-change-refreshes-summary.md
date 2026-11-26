---
id: TC-SUMM-1-05
type: happy
layer: e2e
covers: ["AC3: new quantity, line total and order total after a bag change"]
priority: P1
---

# TC-SUMM-1-05: Changing a quantity in the bag updates the summary on the next checkout visit

## Why

- AC3 protects against a stale summary (cached bag, or totals computed once). The shopper must see the committed new quantity, line total, item count and order total when returning to checkout. It spans the bag page and two checkout loads, so it runs e2e.

## Preconditions

- Scenario `default`; alice's basket is empty.
- Signed in as alice (`alice` / `Pass123$`).
- On `/item/1` alice presses **Add to shopping bag** twice; on `/item/2` she presses it once.

## Steps

1. As alice, navigate to `/checkout`; confirm the "Wanderer Black Hiking Boots" line shows `Qty 2` and `.order-summary-total` shows `$309.97`.
2. Navigate to `/cart`, press **Increase quantity of Wanderer Black Hiking Boots** once and wait until its quantity input shows `3` and its `.catalog-item-total` shows `$329.97`.
3. Navigate to `/checkout`.

## Expected result

- The "Wanderer Black Hiking Boots" `li.order-summary-item` shows `Qty 3` and `.order-summary-item-total` = `$329.97`.
- The "Summit Pro Harness" line still shows `Qty 1` and `$89.99`.
- `.order-summary-count` value = `4`.
- `.order-summary-total` value = `$419.96`.
