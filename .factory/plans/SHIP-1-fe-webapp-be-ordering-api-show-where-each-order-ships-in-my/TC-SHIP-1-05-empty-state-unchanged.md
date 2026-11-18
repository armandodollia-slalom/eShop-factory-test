---
id: TC-SHIP-1-05
type: happy
layer: e2e
covers: ["AC3: no orders looks exactly as today"]
priority: P2
---

# TC-SHIP-1-05: A shopper with no orders sees the unchanged empty state

## Why

- AC3 requires the empty My orders page to stay exactly as it is; adding a column must not leak a stray "Ships to" header or empty list into it. The empty-state branch is rendered only by the real page, so it is checked in the browser with the seeded `bob`, who has no orders in scenario `default`.

## Preconditions

- Scenario `default` loaded; `bob` has no orders.
- Browser viewport 1280 x 800.

## Steps

1. Sign in to the WebApp as `bob` / `Pass123$`.
2. Navigate to `/user/orders`.

## Expected result

- The page title is `My orders | AdventureWorks` and the page header reads `My orders`.
- The empty state is shown: heading `No orders yet`, text `When you place an order, it shows up here with its status and total.`, and a `Start shopping` link to `/`.
- No `.orders-list`, no header row and no element with the text `Ships to` is on the page.
