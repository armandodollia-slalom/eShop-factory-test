---
story: PRB-19
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/254"
story-sha: a2380ecd2d24
plan-sha: efada34d89ca
verified-score: 9
verified-at: "2026-11-18T02:43:16.902Z"
verified-by: test-planner@6ab9e852/council
automation-sha: c2d28819dc4f
automation-plan-sha: efada34d89ca
automation-score: 10
automation-verified-at: "2026-11-18T03:12:27.265Z"
---
# Test plan: PRB-19 [FE - WebApp] - [PROBE] Empty the shopping bag in one step

Scope: the shopping bag page `/cart` in the WebApp. A non-empty bag shows an "Empty bag" button in the summary box below "Continue shopping"; clicking it empties the bag on the server and shows the empty-bag state; an empty bag shows no such button; everything else on the page is unchanged. Every acceptance criterion is about what a signed-in shopper sees and does in the browser, so all cases are `e2e` (Playwright, `e2e/teststack/`) on the test stack, signed in as the seeded user `alice` (`Pass123$`). Products are added through the product page's "Add to shopping bag" button. Seeded products used: item 99 "Adventurer GPS Watch" ($199.99) and item 1 "Wanderer Black Hiking Boots" ($109.99). Each case starts from an empty bag for `alice` (scenario `default` reloaded, or the bag emptied before the case).

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-PRB-19-01 | Non-empty bag shows "Empty bag" in the summary box below "Continue shopping" | happy | e2e | AC1 |
| TC-PRB-19-02 | "Empty bag" removes every product and shows the empty-bag state | happy | e2e | AC2 |
| TC-PRB-19-03 | Emptied bag is still empty after a page reload | happy | e2e | AC3 |
| TC-PRB-19-04 | Empty bag shows no "Empty bag" button | happy | e2e | AC4 |
| TC-PRB-19-05 | Product lines, quantity controls, totals, "Check out" and "Continue shopping" are unchanged | happy | e2e | AC5 |
| TC-PRB-19-06 | Quantity stepper still updates a line and the totals | happy | e2e | AC5 (quantity controls) |
| TC-PRB-19-07 | Removing one product still removes only that line | happy | e2e | AC5 (product lines, quantity controls) |

## Out of scope

- The anonymous redirect from `/cart` to sign-in: existing behaviour the story does not touch.
- Checkout's basket deletion after an order (`BasketState.DeleteBasketAsync`): the Implementation Notes keep it unchanged and the story names no checkout behaviour.
- Unit or functional cases for `BasketState.EmptyBasketAsync` and the Basket gRPC delete: the story's criteria are all browser-visible and AC3 (reload stays empty) proves the server-side delete end to end.

## No sad path

The story adds one button to the bag page and names no error outcome: no validation, no authorization rule, no failure message. AC4 (no button on an empty bag) is a display state, planned as a happy case. Behaviour the story leaves undefined is listed under Open questions instead.

## Open questions

- Header bag count: the Implementation Notes say emptying notifies subscribers so the header bag count updates, but no acceptance criterion states it. No case asserts the header count.
- Failure of the Basket service during "Empty bag" (what the shopper sees, whether lines remain) is not defined by the story.
- Concurrency (emptying in one tab while another tab changes quantities) and double submission of "Empty bag" are not defined by the story.
- Whether emptying `alice`'s bag must leave another user's (`bob`'s) bag intact is implied by per-user baskets but not stated; no case is written for it.
