---
story: BUG-30
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/102"
story-sha: 1f4273365bbb
plan-sha: f53c011c07df
verified-score: 9
verified-at: "2026-11-15T02:48:44.381Z"
verified-by: test-planner@aebddb93/f37226b9
automation-sha: c328a64af93c
automation-plan-sha: f53c011c07df
automation-score: 9
automation-verified-at: "2026-11-15T03:15:25.378Z"
---
# Test plan: BUG-30 [BE - Ordering.API] - Placing an order with a missing or short card number returns 500

Scope: `POST /api/orders?api-version=1.0` in Ordering.API. An otherwise valid order whose `cardNumber` is `"12"`, `""`, missing, or any value shorter than four digits must be answered `400 Bad Request` with an `application/problem+json` validation problem whose `errors` name `CardNumber`, and must not create an order. An order with card number `4012888888881881` keeps returning `200` and creating an order. All cases are functional (`tests/Ordering.FunctionalTests`, existing `OrderingApiFixture`), the cheapest layer that runs the real endpoint and the ordering database.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-30-01 | Order with card number "12" is rejected with a CardNumber validation problem | sad | functional | Repro step 2; Expected 400 problem; no order |
| TC-BUG-30-02 | Order with an empty card number is rejected with a CardNumber validation problem | sad | functional | Repro step 3 (`""`); Expected 400 problem; no order |
| TC-BUG-30-03 | Order without a cardNumber field is rejected with a CardNumber validation problem | sad | functional | Repro step 3 (missing); Expected 400 problem; no order |
| TC-BUG-30-04 | Order with a three-digit card number "123" is rejected with a CardNumber validation problem | sad | functional | "Shorter than four digits" boundary |
| TC-BUG-30-05 | Order with card number "4012888888881881" is accepted and creates an order | happy | functional | Expected: valid card accepted as today |

## Out of scope

- Authentication and the `orders` scope (no token, wrong scope): the story uses a token only to reach the endpoint and does not change authorization; the functional fixture auto-authorizes every request.
- A missing or empty `x-requestid` header combined with a bad card number: the Implementation Notes keep the existing `RequestId is missing.` behavior, and the ticket's Expected section says nothing about it.
- The request-id (`requests`) table: the ticket's contract is "no order is created", which every rejection case checks; the request-id row is an implementation detail from the notes.
- An e2e (Playwright) case: the bug is backend-only and the WebApp always sends a full card number.

## Open questions

- A card number of exactly four characters (for example `"1234"`): the ticket only says numbers shorter than four digits fail and gives `4012888888881881` as a valid example. `CreateOrderCommandValidator` also requires 12 to 19 characters further down the pipeline, so the outcome for 4 to 11 characters is not defined by the story.
- Whitespace-only or non-digit card numbers (for example `"    "`): the story speaks of "digits" but defines no behavior for these.
- The exact message text in `errors.CardNumber` and the problem's `title`: not specified, so cases assert only the key and a non-empty message.
- The story reproduces as `bob` on the test stack; the functional layer substitutes the fixture's fixed identity, which is equivalent for this behavior.
