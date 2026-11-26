---
id: TC-CART-1-16
type: happy
layer: e2e
covers: ["AC1", "Outputs: Saved for later (N) section, Save for later button, total and badge"]
priority: P1
---

# TC-CART-1-16: Pressing Save for later on a cart line moves it to the Saved for later section

## Why

- AC1 end to end: button wiring, section heading with N, saved line contents, and that total and badge exclude saved products. Needs the real browser and stack.

## Preconditions

- E2E on the test stack: `loadScenario('cart-1')` in `beforeEach` (the loader clears every store first, so each case starts from the same state). Scenario `cart-1` (`extends: default`) adds brand-1/type-1 catalog items 2001 "Alpine Pack" (price 40.00), 2002 "Basecamp Mug" (price 10.00) and 2003 "Cedar Headlamp" (price 25.00), each with stock 10, and seeds Redis baskets: alice (id 50ddac7e-9b69-4d68-a91b-25100ef2e403) has cart items 2001 x 2 and 2002 x 1 and saved item 2003 x 3; bob (id bc8b0071-21af-41ab-b1d2-15c4efc368df) has an empty basket. Cart total of alice at start: $90.00; cart badge: 3.
- Signed in as alice (password `Pass123$`).

## Steps

1. Open `/cart`.
2. Press `Save for later` on the cart line "Alpine Pack".

## Expected result

- The cart has one line, "Basecamp Mug" with quantity 1; "Alpine Pack" is no longer a cart line.
- The heading `Saved for later (2)` is shown with exactly two saved lines. The set of lines is asserted, not their order (the story does not define the order):
  - "Cedar Headlamp": quantity text `Quantity: 3`, unit price `$25.00`.
  - "Alpine Pack": quantity text `Quantity: 2`, unit price `$40.00`.
- Each saved line has an `img` whose `alt` text is the product name ("Cedar Headlamp", "Alpine Pack") and whose `src` is non-empty, a `Move to cart` button and a `Remove` button.
- The order total shows `$10.00` and the cart link in the header has a `.cart-button-count` element with text `1`.
