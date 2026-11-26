---
id: TC-CANC-1-02
type: happy
layer: e2e
covers: ["AC1: Orders that are Paid, Shipped or Cancelled have no \"Cancel order\" button"]
priority: P1
---

# TC-CANC-1-02: Paid, Shipped and Cancelled orders show no "Cancel order" button

## Why

- AC1's negative half: offering cancel on a paid, shipped or already cancelled order would invite an action the story forbids ("as long as it has not been paid"). Separate from TC-CANC-1-01 because it guards the opposite side of the status rule. E2E because only the rendered page shows whether the button exists.

## Preconditions

- Scenario `canc-1` freshly loaded: alice has orders 9104 (Paid), 9105 (Shipped) and 9106 (Cancelled).

## Steps

1. Sign in to the WebApp as `alice` / `Pass123$`.
2. Open `/user/orders`.

## Expected result

- The rows for orders 9104, 9105 and 9106 are listed with Status Paid, Shipped and Cancelled.
- None of those three rows contains a "Cancel order" button; the page has no button named `Cancel order 9104`, `Cancel order 9105` or `Cancel order 9106`.
