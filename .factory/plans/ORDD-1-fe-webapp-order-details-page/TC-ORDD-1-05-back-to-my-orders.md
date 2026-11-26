---
id: TC-ORDD-1-05
type: happy
layer: e2e
covers: ["Outputs: link labeled exactly `Back to my orders` returns to My orders", "AC2"]
priority: P2
---

# TC-ORDD-1-05: Back to my orders returns to the My orders page

## Why

- AC2 names the exact label and destination of the return link. e2e because it is a navigation the shopper performs.

## Preconditions

- Scenario `ordd-1`: bob owns order 1.
- Signed in as bob (`bob` / `Pass123$`).

## Steps

1. Open `/user/orders/1`.
2. Click the link whose accessible name is exactly `Back to my orders`.

## Expected result

- The browser URL path is `/user/orders`.
- The page header title reads `Orders` and the orders list shows a row whose order number is `1`.
