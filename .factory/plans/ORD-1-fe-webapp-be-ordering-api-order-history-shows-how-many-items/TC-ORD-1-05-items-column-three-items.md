---
id: TC-ORD-1-05
type: happy
layer: e2e
covers: ["Outputs: Items column between Date and Total", "AC4"]
priority: P1
---

# TC-ORD-1-05: Items column sits between Date and Total and shows 3 items

## Why

- AC4: the visible header text, its position and the plural rendering. E2E because the column is rendered by the Razor page from the API response through the WebApp.

## Preconditions

- Scenario `ord-1` loaded; test stack up.
- Signed in as alice (`Pass123$`).

## Steps

1. Open `/user/orders`.

## Expected result

- The header row's cells read, in order: `Number`, `Date`, `Items`, `Total`, `Status`; the `Items` cell is directly after `Date` and directly before `Total`.
- The row of order 101 has the cell text `3 items`.
