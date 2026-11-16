---
id: TC-CANC-1-08
type: sad
sad-path: conflict
layer: e2e
covers: ["AC3: order paid since My orders was opened → \"This order can no longer be cancelled.\", keeps Paid, no error page"]
priority: P1
---

# TC-CANC-1-08: Cancelling an order that was paid after the page loaded shows "This order can no longer be cancelled." and keeps it Paid

## Why

- AC3 covers the race between the shopper's stale page and the payment pipeline. The risks: the order is cancelled after payment (shopper charged for a cancelled order) or the shopper gets an error page. E2E because the stale page, the WebApp's handling of the API refusal and the rendered message all have to work together. The status change is made directly in the database so the test controls exactly when the order becomes Paid and no status-change event refreshes the page first.

## Preconditions

- Scenario `canc-1` freshly loaded: alice's order 9107 is StockConfirmed (total 60.00).
- The test can run SQL on the test stack's Postgres (`orderingdb`).

## Steps

1. Sign in to the WebApp as `alice` / `Pass123$`.
2. Open `/user/orders`; confirm the button `Cancel order 9107` is visible.
3. Without reloading the page, run `UPDATE ordering.orders SET "OrderStatus" = 'Paid' WHERE "Id" = 9107;` on `orderingdb`.
4. Click the button `Cancel order 9107`.
5. Send `GET /api/orders/9107?api-version=1.0` with alice's bearer token.

## Expected result

- After step 4 the page is still `/user/orders`, headed "My orders"; no error page is shown.
- A `role="alert"` message with the exact text "This order can no longer be cancelled." is shown.
- The row for order 9107 shows Status "Paid" and has no "Cancel order" button.
- Step 5 returns `200` with `status` = `Paid`.
