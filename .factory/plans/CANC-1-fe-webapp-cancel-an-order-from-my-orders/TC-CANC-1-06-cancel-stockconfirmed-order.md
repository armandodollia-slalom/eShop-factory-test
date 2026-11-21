---
id: TC-CANC-1-06
type: happy
layer: e2e
covers: ["AC1: StockConfirmed orders are cancellable", "Story: cancel as long as it has not been paid"]
priority: P2
---

# TC-CANC-1-06: Cancelling a StockConfirmed order shows it as Cancelled

## Why

- StockConfirmed is the last status before Paid, so it is the boundary of "as long as it has not been paid". AC1 offers the button there; if the domain refused the cancel, the shopper would see a button that fails. E2E because the outcome is the rendered row after the full UI → API → domain round trip.

## Preconditions

- Scenario `canc-1` freshly loaded: alice's order 9103 is StockConfirmed (total 20.00).

## Steps

1. Sign in to the WebApp as `alice` / `Pass123$`.
2. Open `/user/orders`.
3. Click the button `Cancel order 9103`.
4. Send `GET /api/orders/9103?api-version=1.0` with alice's bearer token.

## Expected result

- The row for order 9103 shows Status "Cancelled" and has no "Cancel order" button.
- No `role="alert"` message and no error page is shown.
- Step 4 returns `200` with `status` = `Cancelled`.
