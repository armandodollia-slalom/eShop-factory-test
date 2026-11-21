---
id: TC-BUG-41-03
type: happy
layer: e2e
covers: ["Expected: a single click places one order, exactly as today", "Expected: the shopper lands on My orders, as today"]
priority: P1
---

# TC-BUG-41-03: A single click on Place order creates one order and lands on My orders

## Why

- The fix adds a submit-once script and posts the form's `RequestId`; either could break the normal flow (form never submits, or redirect lost). The story requires the single-click flow to stay as today, and only the rendered WebApp shows the redirect, so it is e2e.

## Preconditions

- Test stack running with scenario `default`: user `alice` has an empty shopping bag and no orders.

## Steps

1. Sign in to the WebApp as `alice` / `Pass123$`.
2. Add "Alpine Peak Down Jacket" (item 28) to the shopping bag.
3. Open the shopping bag and click **Check out**.
4. Click **Place order** once.

## Expected result

- The browser navigates to `/user/orders` without any further action, and the page shows the My orders page.
- My orders lists exactly one order, with total `$249.99` and today's date.
