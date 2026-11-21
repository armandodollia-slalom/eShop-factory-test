---
id: TC-CART-1-17
type: happy
layer: e2e
covers: ["AC2", "Outputs: empty cart with saved products shows the empty-cart message and the section below it"]
priority: P1
---

# TC-CART-1-17: An empty cart with saved products shows the empty message and the Saved for later section

## Why

- AC2: the page has an early branch for an empty cart; the risk is that the saved section is hidden there and the shopper believes the saved products are lost.

## Preconditions

- E2E on the test stack: `loadScenario('cart-1')` in `beforeEach` (the loader clears every store first, so each case starts from the same state). Scenario `cart-1` (`extends: default`) adds brand-1/type-1 catalog items 2001 "Alpine Pack" (price 40.00), 2002 "Basecamp Mug" (price 10.00) and 2003 "Cedar Headlamp" (price 25.00), each with stock 10, and seeds Redis baskets: alice (id 50ddac7e-9b69-4d68-a91b-25100ef2e403) has cart items 2001 x 2 and 2002 x 1 and saved item 2003 x 3; bob (id bc8b0071-21af-41ab-b1d2-15c4efc368df) has an empty basket. Cart total of alice at start: $90.00; cart badge: 3.
- Signed in as alice. Cart emptied through the UI by pressing `Save for later` on "Alpine Pack" and on "Basecamp Mug" (saved list becomes Cedar Headlamp x 3, Alpine Pack x 2, Basecamp Mug x 1).

## Steps

1. Open `/cart` (a fresh page load).

## Expected result

- The text `Your shopping bag is empty` is shown.
- Below it the heading `Saved for later (3)` is shown with three saved products.
- The header cart link shows no count: there is no `.cart-button-count` element. This is the existing `CartMenu.razor` behavior for a cart whose total quantity is 0 (it renders the plain `icon-button` link with `aria-label` "Shopping bag"); the story only requires that saved products are not counted, and the 3 saved products here must not produce a count.
