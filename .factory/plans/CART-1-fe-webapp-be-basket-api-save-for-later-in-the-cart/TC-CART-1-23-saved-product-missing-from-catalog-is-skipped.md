---
id: TC-CART-1-23
type: sad
sad-path: not-found
layer: e2e
covers: ["PR check ACC-SEED-1: saved product no longer in the catalog", "Outputs: Saved for later (N) section", "Outputs: saved products not in the order total"]
priority: P2
kept-for: ACC-SEED-1
---

# TC-CART-1-23: The cart page renders and skips a saved product that is no longer in the catalog

## Why

- Regression case for PR check finding ACC-SEED-1, which the PR check upheld and fixed (0b70c06): a saved product whose catalog item was removed broke the cart page. The story's PR-check notes record the fixed behaviour (the page renders and skips that product), so the code after the fix is the contract here. It needs e2e because the failure is in how `CartPage.razor` joins saved products with catalog data, which only the running WebApp against the real Catalog API exercises.

## Preconditions

- E2E on the test stack: `loadScenario('cart-1-missing')` in `beforeEach`. Scenario `cart-1-missing` (`extends: default`) adds brand-1/type-1 catalog items 2001 "Alpine Pack" (price 40.00) and 2003 "Cedar Headlamp" (price 25.00), each with stock 10; catalog item 2999 does not exist. It seeds alice's Redis basket (key `/basket/50ddac7e-9b69-4d68-a91b-25100ef2e403`): cart item 2001 x 2; saved items 2999 "Retired Lantern" (unit price 15.0) x 1 and 2003 "Cedar Headlamp" x 1.
- Signed in as alice (password `Pass123$`).

## Steps

1. Open `/cart`.

## Expected result

- The page renders (no error page): exactly one `.cart-item` line, "Alpine Pack", whose `[data-cart-quantity-input]` has value `2`.
- The order total shows `$80.00`.
- The heading `Saved for later (1)` is shown (exact text).
- The section has exactly one `.cart-saved-item`, named "Cedar Headlamp".
- The text `Retired Lantern` does not appear anywhere on the page.
