---
id: TC-CANC-1-03
type: happy
layer: e2e
covers: ["AC2: clicking Cancel order on a Submitted order shows it as Cancelled without an error", "Code map AC2: list reloaded after the cancel"]
priority: P1
---

# TC-CANC-1-03: Cancelling a Submitted order shows it as Cancelled without an error

## Why

- AC2 is the story's main flow: UI form → WebApp OrderingService → `PUT /api/orders/cancel` → domain → reloaded list. A break anywhere would leave the order Submitted or show an error page. E2E is the only layer that runs the whole chain; the extra API read proves the status was persisted, not just rendered.

## Preconditions

- Scenario `canc-1` freshly loaded: alice's order 9101 is Submitted (total 10.00).

## Steps

1. Sign in to the WebApp as `alice` / `Pass123$`.
2. Open `/user/orders`.
3. Click the button `Cancel order 9101`.
4. Send `GET /api/orders/9101?api-version=1.0` to the Ordering API with alice's bearer token.

## Expected result

- After step 3 the page is still `/user/orders`, headed "My orders"; no error page is shown.
- The row for order 9101 shows Status "Cancelled" and has no "Cancel order" button.
- No `role="alert"` message is shown (neither "This order can no longer be cancelled." nor any other).
- Order 9102's row still shows AwaitingValidation with its "Cancel order" button (only the clicked order changed).
- Step 4 returns `200` with `status` = `Cancelled`.
