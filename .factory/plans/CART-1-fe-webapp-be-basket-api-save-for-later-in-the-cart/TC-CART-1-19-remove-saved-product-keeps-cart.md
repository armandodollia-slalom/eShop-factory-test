---
id: TC-CART-1-19
type: happy
layer: e2e
covers: ["AC5", "Remove button: deletes the saved product, the cart is unchanged"]
priority: P1
---

# TC-CART-1-19: Remove deletes the saved product and leaves the cart unchanged

## Why

- AC5 in the browser: the button deletes rather than moves, and the cart total and badge stay put.

## Preconditions

- E2E on the test stack: `loadScenario('save-for-later')` in `beforeEach` (the loader clears every store first, so each case starts from the same state). Scenario `save-for-later` (`extends: default`) adds brand-1/type-1 catalog items 2001 "Alpine Pack" (price 40.00), 2002 "Basecamp Mug" (price 10.00) and 2003 "Cedar Headlamp" (price 25.00), each with stock 10, and seeds Redis baskets: alice (id 50ddac7e-9b69-4d68-a91b-25100ef2e403) has cart items 2001 x 2 and 2002 x 1 and saved item 2003 x 3; bob (id bc8b0071-21af-41ab-b1d2-15c4efc368df) has an empty basket. Cart total of alice at start: $90.00; cart badge: 3.
- Signed in as alice.

## Steps

1. Open `/cart`.
2. Press `Remove` on the saved product "Cedar Headlamp".

## Expected result

- No heading starting `Saved for later` is shown.
- The cart still has "Alpine Pack" quantity 2 and "Basecamp Mug" quantity 1; the order total is `$90.00` and the header cart count is `3`.
- After reloading `/cart`, "Cedar Headlamp" is not in the cart and not saved.
