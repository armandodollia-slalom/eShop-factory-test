---
id: TC-CANC-1-07
type: happy
layer: e2e
covers: ["AC1: AwaitingValidation orders are cancellable", "Story: cancel as long as it has not been paid"]
priority: P2
---

# TC-CANC-1-07: Cancelling an AwaitingValidation order shows it as Cancelled

## Why

- AC1 shows the button on AwaitingValidation orders, the status an order sits in while stock is checked. A button that is shown but fails would break the story's promise. Separate from TC-CANC-1-03 and -06 because each status takes its own path through `Order.SetCancelledStatus()`. E2E for the same reason as those cases.

## Preconditions

- Scenario `canc-1` freshly loaded: alice's order 9102 is AwaitingValidation (total 30.00).

## Steps

1. Sign in to the WebApp as `alice` / `Pass123$`.
2. Open `/user/orders`.
3. Click the button `Cancel order 9102`.
4. Send `GET /api/orders/9102?api-version=1.0` with alice's bearer token.

## Expected result

- The row for order 9102 shows Status "Cancelled" and has no "Cancel order" button.
- No `role="alert"` message and no error page is shown.
- Step 4 returns `200` with `status` = `Cancelled`.
