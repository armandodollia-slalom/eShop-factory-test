---
story: BUG-57
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/340"
story-sha: 5e402b661e69
plan-sha: 8c35157153bf
verified-score: 10
verified-at: "2026-11-19T16:04:05.871Z"
verified-by: test-planner@3b45d17c/council
automation-sha: af6f8e1fdf2a
automation-plan-sha: 8c35157153bf
automation-score: 10
automation-verified-at: "2026-11-19T16:45:17.924Z"
---
# Test plan: BUG-57 [BE - Ordering API] - Placing an order with a card type the shop does not know answers with a server error

Scope: `POST /api/orders?api-version=1.0`. An order whose `cardTypeId` is not one of the shop's card types (those `GET /api/orders/cardtypes?api-version=1.0` lists: 1 Amex, 2 Visa, 3 MasterCard) must be answered with a 4xx bad request that says the card type is not known, never with a 500, and must not be placed. Orders with a known card type (1, 2, 3) must still be placed with 200.

Layers: rejections stop before the order is saved, so the unknown-card-type values and their boundaries run on the `functional` layer (`tests/Ordering.FunctionalTests`, which seeds card types 1, 2 and 3 through `OrderingContextSeed`). Accepted orders must be saved, which the Ordering functional host cannot do, so the known-card-type cases and the ticket's reproduction (one accepted order, then the same order with card type 99, then checking nothing new was saved) run as API calls as `alice` on the test stack (`e2e` layer, scenario `default`). Several e2e cases place orders for alice on the same stack, so they count her orders before and after instead of assuming an empty list. Card type 99, the ticket's own value, is covered on the stack by TC-BUG-57-02; the functional cases cover 4 (just above the known range), 0 (just below it) and -1 (a negative id). Case number 03 is retired (it duplicated the card type 99 reproduction) and is not reused.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-57-01 | An order with card type 2 (Visa) is placed with 200 and listed in alice's orders | happy | e2e | What happens step 3; What should happen: known card types placed as before |
| TC-BUG-57-02 | Repeating alice's order with card type 99 answers 400 with an error under CardTypeId and places no order | sad (validation) | e2e | What happens step 4; What should happen: 4xx, says card type not known, no server error, order not placed |
| TC-BUG-57-04 | An order with card type 4, just above the highest known card type, answers 400 | sad (boundary) | functional | Unknown card type, just outside the upper end of 1..3 |
| TC-BUG-57-05 | An order with card type 0, just below the lowest known card type, answers 400 | sad (boundary) | functional | Unknown card type, just outside the lower end of 1..3 |
| TC-BUG-57-06 | An order with a negative card type (-1) answers 400 | sad (validation) | functional | Unknown card type, negative id |
| TC-BUG-57-07 | An order with card type 1 (Amex), the lowest known card type, is placed with 200 | happy | e2e | Known card types placed as before, lower boundary just inside |
| TC-BUG-57-08 | An order with card type 3 (MasterCard), the highest known card type, is placed with 200 | happy | e2e | Known card types placed as before, upper boundary just inside |

## Out of scope

- Authentication and authorization of `POST /api/orders` (no token, wrong scope): the bug does not change them.
- The missing or empty `x-requestid` rejection and the short `cardNumber` rejection: existing behaviour the ticket does not change.
- The card type listing `GET /api/orders/cardtypes` itself: unchanged; it is used only as the precondition that defines the known card types.
- WebApp checkout UI: the WebApp only sends card types from its own fixed choice, so the bug is reachable through the API only. No feature video is required beyond the API e2e spec.

## Open questions

- Exact error text: the ticket only requires the answer to say the card type is not known. The current implementation returns `Card type <id> is not known.` under `errors.CardTypeId`; cases assert the `CardTypeId` key and that its message contains `not known`, not the id or the full sentence.
- Precedence when a request has both an unknown card type and another invalid field (a card number shorter than 4 characters, or a missing `x-requestid`): the ticket does not say which error wins. The implementation checks `x-requestid`, then the card number, then the card type. No case asserts that order.
- A card type that is later added to or removed from the Ordering database: the Implementation Notes say the check reads the same source as the listing, but the ticket defines the known set only as 1, 2, 3; no case changes the card type table.
- Idempotency: reusing the `x-requestid` of a rejected unknown-card-type request for a corrected request. The ticket does not say whether the corrected request is then accepted.
