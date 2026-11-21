---
id: TC-SUMM-1-01
type: happy
layer: e2e
covers: ["AC1: Order summary section lists each bag line with product name, quantity and line total"]
priority: P1
---

# TC-SUMM-1-01: Summary lists each bag line with name, quantity and line total

## Why

- AC1 is the core of the story: the shopper must see each bag line with name, quantity and line total before ordering. A wrong multiplication (unit price instead of unit price × quantity) or a missing line would mislead the shopper. Only the rendered checkout page shows this, so the case runs e2e.

## Preconditions

- Scenario `default`; alice's basket is empty.
- Signed in as alice (`alice` / `Pass123$`).
- On `/item/1` alice presses **Add to shopping bag** twice; on `/item/2` she presses it once. Her bag now holds 2 × "Wanderer Black Hiking Boots" ($109.99) and 1 × "Summit Pro Harness" ($89.99).

## Steps

1. As alice, navigate to `/checkout`.

## Expected result

- The page contains a `section.order-summary` whose heading reads `Order summary`.
- It contains exactly 2 `li.order-summary-item` elements.
- Item 1: `.order-summary-item-name` = `Wanderer Black Hiking Boots`, `.order-summary-item-quantity` = `Qty 2`, `.order-summary-item-total` = `$219.98`.
- Item 2: `.order-summary-item-name` = `Summit Pro Harness`, `.order-summary-item-quantity` = `Qty 1`, `.order-summary-item-total` = `$89.99`.
- `.order-summary-empty` is not present.
