---
id: TC-ORDST-1-15
type: happy
layer: e2e
covers: ["AC4: page for a shopper with no orders (\"No orders yet\") is unchanged and has no filter", "AC1: filter only for a shopper with at least one order"]
priority: P1
---

# TC-ORDST-1-15: A shopper with no orders still sees "No orders yet" and no filter

## Why

- AC4 keeps the existing empty state and forbids the filter there; this also guards that a page with no orders and a status in the URL does not say "No Paid orders." instead. bob has no orders in scenario `ordst-1`, so he exercises it while alice's orders exist in the same database.

## Preconditions

- Test stack running with scenario `ordst-1` (bob has no orders).
- Signed in to the WebApp as `bob` / `Pass123$`.

## Steps

1. Open `/user/orders`.
2. Open `/user/orders?status=Paid`.

## Expected result

- After each step: the text `No orders yet` is visible, as is the existing hint `When you place an order, it shows up here with its status and total.`.
- After each step: no element labelled `Status` filter and no link with text `All` or `Paid` from the filter exists; the text `No Paid orders.` and the link `Show all orders` are not shown.
- No order rows are shown.
