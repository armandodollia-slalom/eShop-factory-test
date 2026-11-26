---
id: TC-CANC-1-04
type: happy
layer: e2e
covers: ["AC2: the order stays Cancelled; it never becomes Paid afterwards"]
priority: P1
---

# TC-CANC-1-04: A just-placed order cancelled before processing stays Cancelled after the processors have run

## Why

- AC2 requires that a cancelled order is never charged. The real risk is the background pipeline (OrderProcessor grace period → stock validation → PaymentProcessor) picking up a cancelled order and marking it Paid. Only the test stack runs those processors, so this must be e2e with a real order placed through checkout; a seeded order would not exercise the event chain.

## Preconditions

- Scenario `canc-1` freshly loaded; alice's basket is empty.
- The test stack runs the OrderProcessor (`GracePeriodTime` 1 minute, `CheckUpdateTime` 30 seconds) and the PaymentProcessor (`PaymentSucceeded: true`), so an uncancelled order would reach Paid within about two minutes.

## Steps

1. Sign in to the WebApp as `alice` / `Pass123$`.
2. Open `/item/99`, click "Add to shopping bag", open the shopping bag and check out with address `15703 NE 61st Ct`, `Redmond`, `WA`, `98052`, `U.S.` and place the order.
3. Open `/user/orders`, note the number of the new order (the row with Status Submitted and total `$199.99`), and click its "Cancel order" button within 30 seconds of placing it.
4. Wait 120 seconds.
5. Reload `/user/orders`.
6. Send `GET /api/orders/<new order number>?api-version=1.0` with alice's bearer token.

## Expected result

- After step 3 the new order's row shows Status "Cancelled".
- After step 5 the new order's row still shows Status "Cancelled" (not AwaitingValidation, StockConfirmed or Paid) and has no "Cancel order" button.
- Step 6 returns `200` with `status` = `Cancelled`.
