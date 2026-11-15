---
story: CART-1
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/77"
story-sha: 51e58acf5a6a
plan-sha: e6530018e022
verified-score: 9
verified-at: "2026-11-14T16:09:43.225Z"
verified-by: test-planner@476d82b5/27d172f2
automation-sha: fc955937d9bd
automation-plan-sha: e6530018e022
automation-score: 9
automation-verified-at: "2026-11-14T17:17:34.247Z"
---
# Test plan: CART-1 [FE - WebApp, BE - Basket.API] Save for later in the cart

Scope: the Basket.API operations `SaveForLater`, `MoveToCart`, `RemoveSavedItem`, `GetBasket` and `UpdateBasket` (service behavior with a mocked repository, unit layer), the Redis persistence of saved products including `DeleteBasketAsync` and a basket stored before this change (functional layer, real Redis), and the cart page flows in the browser (e2e). The e2e cases use one new scenario, `save-for-later` (`extends: default`), with catalog items 2001 "Alpine Pack" (40.00), 2002 "Basecamp Mug" (10.00), 2003 "Cedar Headlamp" (25.00) and Redis baskets: alice has cart 2001 x 2, 2002 x 1 and saved 2003 x 3; bob has an empty basket.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-CART-1-01 | SaveForLater moves the whole cart line, with its quantity, to saved items | happy | unit | AC1 |
| TC-CART-1-02 | MoveToCart puts the saved product, with its quantity, into an empty cart | happy | unit | AC3 |
| TC-CART-1-03 | MoveToCart adds the saved quantity to a product already in the cart | happy | unit | AC4 |
| TC-CART-1-04 | RemoveSavedItem deletes the saved product and leaves the cart unchanged | happy | unit | AC5 |
| TC-CART-1-05 | GetBasket returns saved products next to the cart items | happy | unit | Outputs: Basket.API |
| TC-CART-1-06 | UpdateBasket never changes saved products | happy | unit | AC8 |
| TC-CART-1-07 | SaveForLater of a product that is not in the cart fails with NOT_FOUND | sad | unit | AC9 |
| TC-CART-1-08 | MoveToCart of a product that is not saved fails with NOT_FOUND | sad | unit | AC9 |
| TC-CART-1-09 | RemoveSavedItem of a product that is not saved fails with NOT_FOUND | sad | unit | AC9 |
| TC-CART-1-10 | The three new operations reject an anonymous caller | sad | unit | UNAUTHENTICATED |
| TC-CART-1-11 | DeleteBasketAsync empties the cart and keeps the saved products | happy | functional | AC7 |
| TC-CART-1-12 | DeleteBasketAsync with nothing saved leaves an empty cart and nothing saved | happy | functional | Delete |
| TC-CART-1-13 | Saved products round-trip through Redis and survive a new repository instance | happy | functional | AC6 |
| TC-CART-1-14 | A basket stored without SavedItems loads with an empty saved list | sad | functional | Technical Notes |
| TC-CART-1-16 | Save for later moves a cart line to the Saved for later section | happy | e2e | AC1 |
| TC-CART-1-17 | An empty cart with saved products shows the empty message and the section | happy | e2e | AC2 |
| TC-CART-1-18 | Move to cart returns the saved product and hides the section | happy | e2e | AC3 |
| TC-CART-1-19 | Remove deletes the saved product and leaves the cart unchanged | happy | e2e | AC5 |
| TC-CART-1-20 | Placing an order orders only cart items and keeps the saved product | happy | e2e | AC7 |
| TC-CART-1-21 | Bob does not see alice's saved products | sad | e2e | AC10 |
| TC-CART-1-22 | Move to cart from an empty cart puts the saved product with its quantity in the cart | happy | e2e | AC3 |
| TC-CART-1-23 | A saved product no longer in the catalog is skipped and the cart page still renders | sad | e2e | Outputs: WebApp |

## Out of scope

- A limit on the number of saved products; saved products for anonymous shoppers; showing price changes of saved products (Test scope).
- AC4 and AC8 in the browser (Test scope puts them at the API layer only).

## Open questions

- Can the test stack scenario format seed Redis baskets? Existing scenarios only seed Postgres; the e2e preconditions assume a Redis seed (or an equivalent setup step) for alice and bob.
- The story does not say what `SaveForLater` does when the product is already saved; no case was written for it.
- The story does not say whether a deleted basket key is removed; TC-CART-1-12 asserts only an empty cart and nothing saved.
- The order of saved products is not defined; TC-CART-1-16 asserts the set of lines.
- The orders page shows no order lines, so TC-CART-1-20 proves "only cart items ordered" through the order total.
- Whether the header badge counts quantities (assumed: sum of quantities, as `CartMenu.razor` does today) is not stated in the story.
