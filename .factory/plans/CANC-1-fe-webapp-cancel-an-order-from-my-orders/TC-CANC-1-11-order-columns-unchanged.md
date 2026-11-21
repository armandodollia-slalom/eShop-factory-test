---
id: TC-CANC-1-11
type: happy
layer: e2e
covers: ["AC5: number, date, total and status are shown on My orders as today"]
priority: P2
---

# TC-CANC-1-11: My orders still shows each order's number, date, total and status

## Why

- AC5 is a regression guard: the story adds a column of actions to every row, which could shift or drop the existing columns. Seeded orders with known values make each cell checkable. E2E because the columns exist only in the rendered page.

## Preconditions

- Scenario `canc-1` freshly loaded (orders 9101 to 9108 as listed in `_index.md`).

## Steps

1. Sign in to the WebApp as `alice` / `Pass123$`.
2. Open `/user/orders`.

## Expected result

- The list header row shows the columns Number, Date, Total and Status, in that order.
- Exactly 8 order rows are listed (9101 to 9108).
- Row 9102: Number cell `9102`, Date cell representing 2 November 2026 10:00:00, Total cell `$30.00`, Status cell `AwaitingValidation`.
- Row 9104: Number cell `9104`, Date cell representing 4 November 2026 10:00:00, Total cell `$25.00`, Status cell `Paid`.
- Row 9106: Number cell `9106`, Date cell representing 6 November 2026 10:00:00, Total cell `$50.00`, Status cell `Cancelled`.
