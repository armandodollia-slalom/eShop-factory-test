---
id: TC-BUG-41-02
type: sad
sad-path: concurrency
layer: e2e
covers: ["Expected: the shopping bag is emptied after the order, as today (double-click)"]
priority: P2
---

# TC-BUG-41-02: After a double-click on Place order the shopping bag is empty

## Why

- The Expected section keeps "bag emptied after the order" for the double-click flow; blocking or deduplicating the second submit must not leave the basket untouched or the checkout half-done. It is a separate observable from the order count in TC-BUG-41-01, so it gets its own case; the double-click only exists in the browser, hence e2e.

## Preconditions

- Test stack running with scenario `default`: user `alice` has an empty shopping bag and no orders.

## Steps

1. Sign in to the WebApp as `alice` / `Pass123$`.
2. Add "Alpine Peak Down Jacket" (item 28) to the shopping bag.
3. Open the shopping bag and click **Check out**.
4. Double-click **Place order**.
5. Wait until the browser has navigated away from `/checkout`, then open the shopping bag (`/cart`).

## Expected result

- The shopping bag page shows no items (the empty-bag state; "Alpine Peak Down Jacket" is not listed).
- The header's shopping bag badge shows no item count.
