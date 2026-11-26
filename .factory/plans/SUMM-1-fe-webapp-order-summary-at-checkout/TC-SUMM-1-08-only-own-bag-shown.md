---
id: TC-SUMM-1-08
type: sad
sad-path: ownership
layer: e2e
covers: ["AC1: summary lists her (the signed-in shopper's) bag lines"]
priority: P2
---

# TC-SUMM-1-08: Summary shows only the signed-in shopper's bag, not another user's

## Why

- AC1 says the summary lists "her shopping bag". Leaking another user's bag into the summary (wrong buyer id, shared cache in the server-rendered page) would show private data and wrong totals. Two separate browser contexts on the test stack are the only realistic way to check this.

## Preconditions

- Scenario `default`; alice's and bob's baskets are empty.
- In browser context A, signed in as bob (`bob` / `Pass123$`): on `/item/2` bob presses **Add to shopping bag** once. Bob's bag holds 1 × "Summit Pro Harness".
- In browser context B, signed in as alice (`alice` / `Pass123$`): on `/item/1` alice presses **Add to shopping bag** once. Alice's bag holds 1 × "Wanderer Black Hiking Boots".

## Steps

1. In context B (alice), navigate to `/checkout`.
2. In context A (bob), navigate to `/checkout`.

## Expected result

- Step 1: exactly 1 `li.order-summary-item`, name `Wanderer Black Hiking Boots`, `Qty 1`, `$109.99`; `.order-summary-count` = `1`; `.order-summary-total` = `$109.99`; the text `Summit Pro Harness` does not appear in `section.order-summary`.
- Step 2: exactly 1 `li.order-summary-item`, name `Summit Pro Harness`, `Qty 1`, `$89.99`; `.order-summary-total` = `$89.99`; the text `Wanderer Black Hiking Boots` does not appear in `section.order-summary`.
