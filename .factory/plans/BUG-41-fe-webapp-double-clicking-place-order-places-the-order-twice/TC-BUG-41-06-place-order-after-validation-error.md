---
id: TC-BUG-41-06
type: sad
sad-path: validation
layer: e2e
covers: ["Expected: a single click places one order, exactly as today (form can be submitted again after a validation error)"]
priority: P1
---

# TC-BUG-41-06: Place order still works after the form was rejected by a validation error

## Why

- Today a shopper who leaves a required address field empty sees a validation message, fixes it and places the order. A submit-once guard that is not released after the server re-renders the form would leave Place order dead, a regression of the "as today" single-click flow. Only the browser runs the guard, so it is e2e.

## Preconditions

- Test stack running with scenario `default`: user `alice` has an empty shopping bag and no orders.

## Steps

1. Sign in to the WebApp as `alice` / `Pass123$`.
2. Add "Alpine Peak Down Jacket" (item 28) to the shopping bag, open the bag and click **Check out**.
3. Clear the **Address** field and click **Place order** once.
4. Type `15703 NE 61st Ct` into the **Address** field and click **Place order** once.

## Expected result

- After step 3 the browser stays on `/checkout` and a validation message is shown for the Address field; opening `/user/orders` in a separate tab at this point lists no orders.
- After step 4 the browser navigates to `/user/orders`, which lists exactly one order with total `$249.99`.
