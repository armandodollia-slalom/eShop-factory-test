---
story: BUG-56
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/337"
story-sha: f62e62c2eb63
plan-sha: e568c6c0b5fe
verified-score: 10
verified-at: "2026-11-19T05:36:43.443Z"
verified-by: test-planner@3b45d17c/council
automation-sha: 5551dfe24d76
automation-plan-sha: e568c6c0b5fe
automation-score: 9
automation-verified-at: "2026-11-19T05:49:03.861Z"
---
# Test plan: BUG-56 [BE - Ordering API] - An order draft with a zero or negative quantity, or a negative price, answers with a server error

Scope: `POST /api/orders/draft?api-version=1.0`. A draft line with a quantity below 1 or a negative unit price must be answered with a 400 problem-details response that says what is wrong (no 500), on any line of the draft, while valid drafts keep their 200 answer. Every case runs on the `functional` layer (`tests/Ordering.FunctionalTests`): a draft is computed in memory and never saved, so the Ordering functional host can serve both the accepted and the rejected drafts.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-56-01 | A valid draft is answered with 200 and the computed draft | happy | functional | Valid drafts answered as before (qty 2 x 10 = 20) |
| TC-BUG-56-02 | A draft line with quantity 0 is answered with 400 problem details naming the quantity | sad (boundary) | functional | Quantity below 1, just outside |
| TC-BUG-56-03 | A draft line with quantity -2 is answered with 400 problem details naming the quantity | sad (validation) | functional | Quantity below 1, negative |
| TC-BUG-56-04 | A draft line with quantity 1 is accepted with 200 | happy | functional | Quantity limit, just inside |
| TC-BUG-56-05 | A draft line with unit price -5 and quantity 1 is answered with 400 problem details naming the price | sad (validation) | functional | Negative price |
| TC-BUG-56-06 | A draft line with unit price -0.01 is answered with 400 problem details naming the price | sad (boundary) | functional | Negative price, just outside |
| TC-BUG-56-07 | A draft line with unit price 0 is accepted with 200 and total 0 | happy | functional | Price limit, just inside |
| TC-BUG-56-08 | A draft whose second line has quantity 0 is rejected with 400 even though its first line is valid | sad (validation) | functional | Quantity rule applies to every line |
| TC-BUG-56-09 | A draft whose second line has a negative unit price is rejected with 400 even though its first line is valid | sad (validation) | functional | Price rule applies to every line |

## Out of scope

- Authentication and authorization of the draft endpoint (no token, wrong scope): the bug does not change them.
- The empty or missing `items` rejection: unchanged by this bug and already covered by BUG-15's plan (`OrderDraftValidationTests`).
- E2E/UI coverage: the WebApp only builds drafts from basket lines with positive quantities and catalog prices; the bug is API-only, so no feature video is required.
- Order creation (`POST /api/orders`) with invalid lines: the ticket is about drafts only.

## Open questions

- A line that is invalid on both counts (quantity 0 and price -5): the ticket does not say which message wins. The Implementation Notes say the quantity message is returned; no case asserts that order.
- Exact `detail` texts are taken from the Implementation Notes' code map ("The quantity of each item must be at least 1." / "The unit price of an item cannot be negative."); the ticket only requires the answer to say what is wrong.
- Negative `discount` / `oldUnitPrice` values: the ticket names only quantity and unit price.
