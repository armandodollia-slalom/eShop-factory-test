---
id: TC-ORDST-1-10
type: happy
layer: e2e
covers: ["AC2: choosing a status shows only my orders in that status", "AC2: same columns and order as today", "AC2: address becomes /user/orders?status=<name>", "AC6: columns, totals, status badges unchanged"]
priority: P1
---

# TC-ORDST-1-10: Choosing "Paid" shows only the Paid orders, unchanged, and the address becomes /user/orders?status=Paid

## Why

- The core user flow of the story: choose a status, see only matching orders rendered exactly as in the full list, with a shareable URL. Comparing against the unfiltered rows in the same test catches changed columns, totals, badges or ordering (AC6). Two Paid orders are needed to check their relative order.

## Preconditions

- Test stack running with scenario `ordst-1`.
- Signed in to the WebApp as `alice` / `Pass123$`.

## Steps

1. Open `/user/orders`; record the header row texts and, for orders 101 and 102, each row's cell texts (order number, date, total, status) and the status badge's CSS classes, plus the relative position of 101 and 102.
2. Click the `Paid` option of the Status filter.

## Expected result

- The URL path and query are exactly `/user/orders?status=Paid`.
- `Paid` is marked `aria-current="true"`; `All` is not.
- The list shows exactly 2 rows: orders 101 and 102; orders 103 and 104 are not shown.
- The header row texts are identical to those recorded in step 1.
- Each of the two rows has the same cell texts (including totals `10.00` and `20.00` as formatted in step 1) and the same badge classes (`status paid`) as recorded in step 1, and they appear in the same relative order.
