---
id: TC-ORDST-1-12
type: happy
layer: e2e
covers: ["AC3: /user/orders?status=<name> opened directly selects that status and filters the list"]
priority: P1
---

# TC-ORDST-1-12: Opening /user/orders?status=Cancelled directly selects Cancelled and filters the list

## Why

- AC3 makes the filtered URL bookmarkable: the state must come from the address on first load, not only from clicking. Uses a different status than TC-ORDST-1-10 (Cancelled) so a page that only ever filters by Paid would fail.

## Preconditions

- Test stack running with scenario `ordst-1` (alice's only Cancelled order is 104).
- Signed in to the WebApp as `alice` / `Pass123$`.

## Steps

1. Navigate directly (address bar, no prior click) to `/user/orders?status=Cancelled`.

## Expected result

- `Cancelled` is marked `aria-current="true"`; `All` is not.
- The list shows exactly 1 row: order 104 with status badge text `Cancelled` and total `40.00` as formatted by the page.
- The URL remains `/user/orders?status=Cancelled`.
