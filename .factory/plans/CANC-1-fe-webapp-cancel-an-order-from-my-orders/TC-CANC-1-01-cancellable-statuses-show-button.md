---
id: TC-CANC-1-01
type: happy
layer: e2e
covers: ["AC1: Submitted, AwaitingValidation or StockConfirmed order rows have a \"Cancel order\" button"]
priority: P1
---

# TC-CANC-1-01: Submitted, AwaitingValidation and StockConfirmed orders each show a "Cancel order" button

## Why

- AC1 names three statuses that must offer the button; if one were missing from the cancellable set, the shopper could not cancel an unpaid order. One case for all three because it is one rule observed on one page. E2E because the button only exists in the rendered WebApp page and the statuses come from the real Ordering API.

## Preconditions

- Scenario `canc-1` freshly loaded (see `_index.md`): alice has orders 9101 (Submitted), 9102 (AwaitingValidation), 9103 (StockConfirmed), 9107 (StockConfirmed), 9108 (Submitted) among others.

## Steps

1. Sign in to the WebApp as `alice` / `Pass123$`.
2. Open `/user/orders`.

## Expected result

- The rows for orders 9101, 9102, 9103, 9107 and 9108 each contain exactly one button with the visible text "Cancel order" (accessible name `Cancel order <number>`, for example `Cancel order 9101`).
- The Status cell of those rows reads Submitted, AwaitingValidation, StockConfirmed, StockConfirmed and Submitted respectively.
- No error page and no `role="alert"` message is shown.
