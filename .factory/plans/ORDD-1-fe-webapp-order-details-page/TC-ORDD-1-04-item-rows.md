---
id: TC-ORDD-1-04
type: happy
layer: e2e
covers: ["Outputs: one row per item with product name, unit price, units and line total (unit price × units)", "AC1"]
priority: P1
---

# TC-ORDD-1-04: Details page lists each item with name, unit price, units and line total

## Why

- The item rows are the core of "see what it contains". Two items, one with 2 units, check one row per item and that the line total multiplies unit price by units rather than repeating the unit price. e2e because the line total is computed in the page.

## Preconditions

- Scenario `ordd-1`: bob's order 1 has items `Wanderer Black Hiking Boots` 109.99 × 2 and `Summit Pro Harness` 89.99 × 1.
- Signed in as bob (`bob` / `Pass123$`).

## Steps

1. Open `/user/orders/1`.

## Expected result

- The `Items` section has exactly 2 item rows (header row excluded).
- Row `Wanderer Black Hiking Boots`: unit price `$109.99`, units `2`, line total `$219.98`.
- Row `Summit Pro Harness`: unit price `$89.99`, units `1`, line total `$89.99`.
