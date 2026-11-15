---
id: TC-CART-1-22
type: happy
layer: e2e
covers: ["AC3"]
priority: P1
---

# TC-CART-1-22: Move to cart from an empty cart puts the saved product with its quantity in the cart

## Why

- AC3 in the browser with the cart empty: the saved quantity is kept and the Saved for later section is no longer shown.

## Preconditions

- E2E on the test stack: `loadScenario('cart-1-saved')` in `beforeEach`. Scenario `cart-1-saved` (`extends: default`) adds catalog items 2001 "Alpine Pack" (40.00), 2002 "Basecamp Mug" (10.00) and 2003 "Cedar Headlamp" (25.00) and seeds Redis: alice (id 50ddac7e-9b69-4d68-a91b-25100ef2e403) has an empty cart and saved item 2003 x 2.
- Signed in as alice.

## Steps

1. Open `/cart`.
2. Press `Move to cart` on "Cedar Headlamp".
3. Reload `/cart`.

## Expected result

- Before the move: the empty-cart message and `Saved for later (1)` with "Cedar Headlamp" quantity 2.
- After the move: the cart has one line, "Cedar Headlamp" quantity 2; the order total is `$50.00` and the header cart count is `2`.
- No element with heading text starting `Saved for later` exists on the page, before and after the reload.
