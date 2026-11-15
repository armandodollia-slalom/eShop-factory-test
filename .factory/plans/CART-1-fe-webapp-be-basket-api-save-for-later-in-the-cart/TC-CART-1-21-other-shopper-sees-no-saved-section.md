---
id: TC-CART-1-21
type: sad
sad-path: ownership
layer: e2e
covers: ["AC10", "Saved products belong to one shopper"]
priority: P1
---

# TC-CART-1-21: Bob does not see alice's saved products

## Why

- AC10: isolation between shoppers; the basket is keyed by user id and a shared key would leak saved products.

## Preconditions

- E2E on the test stack: `loadScenario('cart-1')` in `beforeEach` (the loader clears every store first, so each case starts from the same state). Scenario `cart-1` (`extends: default`) adds brand-1/type-1 catalog items 2001 "Alpine Pack" (price 40.00), 2002 "Basecamp Mug" (price 10.00) and 2003 "Cedar Headlamp" (price 25.00), each with stock 10, and seeds Redis baskets: alice (id 50ddac7e-9b69-4d68-a91b-25100ef2e403) has cart items 2001 x 2 and 2002 x 1 and saved item 2003 x 3; bob (id bc8b0071-21af-41ab-b1d2-15c4efc368df) has an empty basket. Cart total of alice at start: $90.00; cart badge: 3.

## Steps

1. Sign in as bob (password `Pass123$`).
2. Open `/cart`.

## Expected result

- The text `Your shopping bag is empty` is shown.
- No element with heading text starting `Saved for later` exists on the page, and "Cedar Headlamp" appears nowhere on it.
