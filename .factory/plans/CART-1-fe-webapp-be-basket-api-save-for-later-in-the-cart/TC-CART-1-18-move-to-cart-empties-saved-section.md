---
id: TC-CART-1-18
type: happy
layer: e2e
covers: ["Move to cart button: moves the saved product, with its quantity, back to the cart (cart has other products)", "Outputs: section not shown when nothing is saved"]
priority: P1
---

# TC-CART-1-18: Move to cart returns the saved product to the cart and hides the section

## Why

- The `Move to cart` input rule in the browser when the cart already has other products (no merge): the saved quantity is kept, the existing lines are untouched, and the section disappears once the last saved product moves. AC3's literal empty-cart precondition is TC-CART-1-22.

## Preconditions

- E2E on the test stack: `loadScenario('cart-1')` in `beforeEach` (the loader clears every store first, so each case starts from the same state). Scenario `cart-1` (`extends: default`) adds brand-1/type-1 catalog items 2001 "Alpine Pack" (price 40.00), 2002 "Basecamp Mug" (price 10.00) and 2003 "Cedar Headlamp" (price 25.00), each with stock 10, and seeds Redis baskets: alice (id 50ddac7e-9b69-4d68-a91b-25100ef2e403) has cart items 2001 x 2 and 2002 x 1 and saved item 2003 x 3; bob (id bc8b0071-21af-41ab-b1d2-15c4efc368df) has an empty basket. Cart total of alice at start: $90.00; cart badge: 3.
- Signed in as alice.

## Steps

1. Open `/cart`.
2. Press `Move to cart` on "Cedar Headlamp".

## Expected result

- The cart has three lines: "Alpine Pack" quantity 2, "Basecamp Mug" quantity 1 and "Cedar Headlamp" quantity 3.
- No element with heading text starting `Saved for later` exists on the page.
- The order total shows `$165.00` and the header cart count is `6`.
