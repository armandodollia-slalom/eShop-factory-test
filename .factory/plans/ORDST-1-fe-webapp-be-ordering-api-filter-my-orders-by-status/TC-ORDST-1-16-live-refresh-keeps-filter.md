---
id: TC-ORDST-1-16
type: happy
layer: e2e
covers: ["AC6: the list refreshing when an order's status changes", "AC6: the refreshed list keeps the selected filter"]
priority: P2
---

# TC-ORDST-1-16: When a Paid order is shipped, the refreshed list keeps the Paid filter

## Why

- AC6 requires the existing live refresh to keep working and to keep the selected filter; a refresh that reloaded `/user/orders` would silently drop it and show all orders. Shipping order 101 through the Ordering API raises the real status-change event the WebApp listens to, so this needs the full test stack.

## Preconditions

- Test stack running with a fresh copy of scenario `ordst-1` (orders 101 and 102 are Paid).
- Signed in to the WebApp as `alice` / `Pass123$`.
- A bearer token for `alice` for the Ordering API.

## Steps

1. Open `/user/orders?status=Paid`; the list shows orders 101 and 102.
2. Without reloading the page, send `PUT /api/orders/ship?api-version=1.0` with alice's token, header `x-requestid: <new GUID>` and body `{"orderNumber": 101}`; expect `200 OK`.
3. Wait (up to 15 seconds) for the list to change without any user action.

## Expected result

- The list updates on its own to show exactly 1 row: order 102 with status `Paid`; order 101 is no longer shown.
- The URL is still `/user/orders?status=Paid`, and `Paid` is still marked `aria-current="true"`.
- Orders 103 and 104 are not shown.
