---
id: TC-CART-1-23
type: sad
layer: e2e
covers: ["Outputs: WebApp cart page", "Saved product no longer in the catalog"]
priority: P2
---

# TC-CART-1-23: A saved product that is no longer in the catalog is skipped and the cart page still renders

## Why

- Saved products are long-lived; one that has left the catalog must not break the cart page. Regression test for the WebApp `BasketState` change that skips such saved products.

## Preconditions

- E2E on the test stack: `loadScenario('cart-1-saved')` in `beforeEach`. Scenario `cart-1-saved` seeds Redis: bob (id bc8b0071-21af-41ab-b1d2-15c4efc368df) has cart item 2001 "Alpine Pack" x 1 and saved items 2002 "Basecamp Mug" x 1 and 2999 "Retired Lantern" x 1; product 2999 is not in the catalog.
- Signed in as bob.

## Steps

1. Open `/cart`.

## Expected result

- The page loads without an error; the cart has one line, "Alpine Pack" quantity 1, the order total is `$40.00` and the header cart count is `1`.
- `Saved for later (1)` lists only "Basecamp Mug" quantity 1; "Retired Lantern" is not shown anywhere on the page.
