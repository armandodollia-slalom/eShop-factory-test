---
id: TC-ORDST-1-14
type: happy
layer: e2e
covers: ["AC4: status none of my orders has shows \"No <name> orders.\" instead of the list", "AC4: link \"Show all orders\" to /user/orders", "AC4: filter still shown for a shopper with orders"]
priority: P1
---

# TC-ORDST-1-14: A status none of alice's orders has shows "No StockConfirmed orders." and a "Show all orders" link

## Why

- AC4 distinguishes "no orders in this status" from "no orders at all"; a page that showed "No orders yet" here would tell a shopper with four orders that they have none. Clicking the link checks it really leads back to the full list.

## Preconditions

- Test stack running with scenario `ordst-1` (alice has no StockConfirmed orders).
- Signed in to the WebApp as `alice` / `Pass123$`.

## Steps

1. Open `/user/orders`.
2. Click the `StockConfirmed` option of the Status filter.
3. Click the link `Show all orders`.

## Expected result

- After step 2: the URL is `/user/orders?status=StockConfirmed`; the text `No StockConfirmed orders.` is visible; no order rows and no list header row are shown; the text `No orders yet` is not shown; the Status filter is still visible with `StockConfirmed` marked `aria-current="true"`.
- The link `Show all orders` has `href` resolving to `/user/orders` (no query).
- After step 3: the URL is `/user/orders` with no query, `All` is selected, and the list shows orders 101, 102, 103 and 104.
