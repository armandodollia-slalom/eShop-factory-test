---
id: TC-ORD-1-08
type: sad
sad-path: ownership
layer: e2e
covers: ["Inputs: only the signed-in user's orders", "AC7"]
priority: P1
---

# TC-ORD-1-08: Order history lists only the signed-in user's orders

## Why

- AC7 at UI level: with two users who both have orders, each must see only their own rows and counts.

## Preconditions

- Scenario `ord-1` loaded; test stack up. alice has orders 101 and 102; bob has order 103.

## Steps

1. Sign in as bob and open `/user/orders`.
2. Sign out, sign in as alice and open `/user/orders`.

## Expected result

- Step 1: exactly one order row, order 103, with the cell text `4 items`.
- Step 2: exactly two order rows, orders 101 (`3 items`) and 102 (`1 item`); no row for order 103.
