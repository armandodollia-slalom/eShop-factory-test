---
id: TC-ORDST-1-11
type: happy
layer: e2e
covers: ["AC2: choosing All shows every order again and the address is /user/orders"]
priority: P1
---

# TC-ORDST-1-11: Choosing "All" after a filter shows every order again at /user/orders

## Why

- AC2 requires "All" to clear the filter and drop the parameter entirely (not `?status=All` or `?status=`, which the API would reject). Starting from a filtered page proves the selection is undone, not just the initial state.

## Preconditions

- Test stack running with scenario `ordst-1`.
- Signed in to the WebApp as `alice` / `Pass123$`.

## Steps

1. Open `/user/orders?status=Shipped` (shows only order 103).
2. Click the `All` option of the Status filter.

## Expected result

- The URL path is `/user/orders` with no query string (no `status` parameter).
- `All` is marked `aria-current="true"`; `Shipped` is not.
- The list shows exactly 4 rows: orders 101, 102, 103 and 104.
