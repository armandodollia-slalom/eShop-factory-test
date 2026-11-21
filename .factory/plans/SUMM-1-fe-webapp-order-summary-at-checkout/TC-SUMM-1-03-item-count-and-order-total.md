---
id: TC-SUMM-1-03
type: happy
layer: e2e
covers: ["AC2: number of items (3)", "AC2: order total ($309.97)"]
priority: P1
---

# TC-SUMM-1-03: Summary shows the item count 3 and order total $309.97

## Why

- AC2 requires the item count (sum of quantities, not number of lines) and the order total. Counting lines would show 2 instead of 3, which is the likely bug; the total must be the sum of line totals. Kept separate from TC-SUMM-1-01 because it checks the totals block, not the lines.

## Preconditions

- Scenario `default`; alice's basket is empty.
- Signed in as alice (`alice` / `Pass123$`).
- On `/item/1` alice presses **Add to shopping bag** twice; on `/item/2` she presses it once (2 × $109.99 + 1 × $89.99).

## Steps

1. As alice, navigate to `/checkout`.

## Expected result

- `.order-summary-count` contains the label `Items` and the value `3`.
- `.order-summary-total` contains the label `Total` and the value `$309.97`.
