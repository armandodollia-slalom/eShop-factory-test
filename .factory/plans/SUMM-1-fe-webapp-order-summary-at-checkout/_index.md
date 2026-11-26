---
story: SUMM-1
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/151"
story-sha: 990c52460f1e
plan-sha: 70d4d754e314
verified-score: 10
verified-at: "2026-11-15T15:17:35.834Z"
verified-by: test-planner@1edb523e/67b01306
automation-sha: 75c8e10a91ea
automation-plan-sha: 70d4d754e314
automation-score: 10
automation-verified-at: "2026-11-15T15:28:27.926Z"
---
# Test plan: SUMM-1 [FE - WebApp] - Order summary at checkout

The checkout page (`/checkout`) gains an "Order summary" section that lists the signed-in shopper's bag lines (name, quantity, line total, in bag order), the item count and the order total, or "Your shopping bag is empty" for an empty bag. Placing an order, the shipping address form, its validation and the "Back to the shopping bag" link must behave as before. Everything a shopper sees here is rendered by the WebApp, so every case runs as a Playwright e2e spec on the test stack (`e2e/teststack/summ-1.spec.ts`) against scenario `default` (demo catalog: item 1 "Wanderer Black Hiking Boots" $109.99, item 2 "Summit Pro Harness" $89.99; users alice and bob, password `Pass123$`, empty baskets, no orders). Bags are filled through the UI: sign in, open `/item/<id>`, press **Add to shopping bag** once per unit. No extra scenario data is needed.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-SUMM-1-01 | Summary lists each bag line with name, quantity and line total | happy | e2e | AC1 |
| TC-SUMM-1-02 | Summary lines follow the shopping bag's order | happy | e2e | AC1 "in the same order as the shopping bag" |
| TC-SUMM-1-03 | Summary shows the item count 3 and order total $309.97 | happy | e2e | AC2 |
| TC-SUMM-1-04 | Line total and order total above $1,000 use the bag's thousands format | sad | e2e | AC2 "formatted like the shopping bag's prices" |
| TC-SUMM-1-05 | Changing a quantity in the bag updates the summary on the next checkout visit | happy | e2e | AC3 |
| TC-SUMM-1-06 | Empty bag shows "Your shopping bag is empty" instead of list and totals | happy | e2e | AC4 summary text |
| TC-SUMM-1-07 | Place order with an empty bag still shows "Your cart is empty" | sad | e2e | AC4 Place order |
| TC-SUMM-1-08 | Summary shows only the signed-in shopper's bag, not another user's | sad | e2e | AC1 "her shopping bag" |
| TC-SUMM-1-09 | Placing the order from checkout lands on the orders page with the new order | happy | e2e | AC5 order placed |
| TC-SUMM-1-10 | Shipping address validation still blocks an order with an empty Address | sad | e2e | AC5 form validation unchanged |
| TC-SUMM-1-11 | "Back to the shopping bag" link still returns to /cart | happy | e2e | AC5 back link unchanged |

## Out of scope

- Unit and functional tests: the story changes only the Razor checkout page; the Basket gRPC API and the Ordering API are unchanged, so their existing functional tests stay as they are.
- Visual styling of the summary (layout, colours, `Checkout.razor.css`): the story states no measurable design rule; the PR check's design review covers it.
- Access to `/checkout` without signing in: the page's `[Authorize]` behaviour is unchanged and the story says nothing about it.
- The pre-filled shipping address values (from alice's claims): unchanged and not described by the story beyond "the shipping address form ... unchanged"; TC-SUMM-1-09 relies on them being valid.

## Open questions

- AC5 "she lands on her orders as today": the story does not say whether the bag must be empty afterwards or which status the new order shows. TC-SUMM-1-09 asserts only the URL `/user/orders` and one order row with total `$309.97`.
- AC3 says "changes a quantity" without saying whether removing a line (quantity 0) counts. TC-SUMM-1-05 covers raising a quantity only; a removal case was not written.
- The story does not say what the summary shows when the Basket service is unavailable; no dependency-failure case was written.
- The story does not say whether the summary is still shown after a failed validation postback (TC-SUMM-1-07, TC-SUMM-1-10); those cases assert only the validation messages and that no order is created.
