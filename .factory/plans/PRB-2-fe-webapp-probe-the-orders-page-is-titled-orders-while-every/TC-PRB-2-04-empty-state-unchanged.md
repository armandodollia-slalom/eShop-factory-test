---
id: TC-PRB-2-04
type: happy
layer: e2e
covers: ["Expected: everything else on the page is unchanged (no-orders state)"]
priority: P2
---

# TC-PRB-2-04: With no orders, the page body still shows the "No orders yet" empty state

## Why

- The ticket requires that only the heading and title change. alice has no orders in the `default` scenario, so the page body she sees is the empty state; this case guards against the text change disturbing it. e2e because the empty state is rendered markup.

## Preconditions

- Test stack running with scenario `default` (alice has no orders).
- Signed in to the WebApp as `alice` / `Pass123$`.

## Steps

1. Navigate to `/user/orders`.

## Expected result

- The page header `h1` has the exact text `My orders`.
- An `h2` with the exact text `No orders yet` is visible inside `.orders-empty`.
- The paragraph `When you place an order, it shows up here with its status and total.` is visible.
- A link `Start shopping` with `href="/"` is visible.
- The page has no `.orders-list` element.
