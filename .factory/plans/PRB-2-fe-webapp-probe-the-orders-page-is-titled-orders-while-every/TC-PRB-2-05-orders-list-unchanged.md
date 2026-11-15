---
id: TC-PRB-2-05
type: happy
layer: e2e
covers: ["Expected: the list of orders is unchanged"]
priority: P2
---

# TC-PRB-2-05: With one order, the orders list still shows its header row and the order under the "My orders" heading

## Why

- The ticket states explicitly that "the list of orders" is unchanged. The `default` scenario has no orders, so the order is created through the WebApp checkout (the same path `e2e/CheckoutTest.spec.ts` uses) to make the list render. e2e because the list is WebApp markup fed by the Ordering API.

## Preconditions

- Test stack running with scenario `default` (alice has no orders, empty basket).
- Signed in to the WebApp as `alice` / `Pass123$`.
- alice has added catalog item 99 "Adventurer GPS Watch" (quantity 1) to her shopping bag from its product page `/item/99`.

## Steps

1. Navigate to `/cart` and click the link "Check out".
2. On the Checkout page, leave the pre-filled shipping address (Address `15703 NE 61st Ct`, City `Redmond`) and click the button "Place order".

## Expected result

- The URL ends with `/user/orders`.
- The page header `h1` has the exact text `My orders`.
- The page title is exactly `My orders | AdventureWorks`.
- `.orders-list` is visible and its header row `.orders-header` shows the column labels `Number`, `Date`, `Total`, `Status` in that order.
- Exactly 1 `.order-number` element is present (one order row besides the header).
- The page has no `.orders-empty` element.
