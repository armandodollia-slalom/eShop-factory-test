---
story: BUG-10
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/22"
story-sha: 79694346c46a
plan-sha: 6fbd7cc9ac65
verified-score: 9
verified-at: "2026-11-13T11:41:23.867Z"
verified-by: test-planner@a978a288/27d172f2
automation-sha: d380af56b0aa
automation-plan-sha: 6fbd7cc9ac65
automation-score: 10
automation-verified-at: "2026-11-13T11:57:55.265Z"
---
# Test plan: BUG-10 [BE - Ordering.API] Invalid order status changes return 500 instead of a client error

Scope: `PUT /api/orders/cancel` and `PUT /api/orders/ship` in Ordering.API. A forbidden status transition must return 409 with a `ProblemDetails` body, a nonexistent order 404, a command validation failure 400, and other failures stay 500. The success path, the empty `x-requestid` 400, the idempotency rollback after a rule violation and the unchanged order creation behavior are also covered.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-10-01 | Cancelling a Shipped order returns 409 with the domain message | sad | functional | Expected 409; Decisions (409 ProblemDetails) |
| TC-BUG-10-02 | Cancelling a Paid order returns 409 | sad | functional | SetCancelledStatus rule |
| TC-BUG-10-03 | Shipping a Cancelled order returns 409 | sad | functional | SetShippedStatus rule |
| TC-BUG-10-04 | Shipping a Submitted order returns 409 | sad | functional | SetShippedStatus rule |
| TC-BUG-10-05 | Cancelling a nonexistent order returns 404 | sad | functional | Decisions (404) |
| TC-BUG-10-06 | Shipping a nonexistent order returns 404 | sad | functional | Decisions (404) |
| TC-BUG-10-07 | Cancelling with order number 0 returns 400 | sad | functional | Decisions (validation 400) |
| TC-BUG-10-08 | Shipping with order number 0 returns 400 | sad | functional | Decisions (validation 400) |
| TC-BUG-10-09 | Empty x-requestid still returns 400 | sad | functional | Code map (400 unchanged) |
| TC-BUG-10-10 | Cancelling a Submitted order still returns 200 | happy | functional | Code map (200 unchanged) |
| TC-BUG-10-11 | Shipping a Paid order still returns 200 | happy | functional | Code map (200 unchanged) |
| TC-BUG-10-12 | Retry with the same x-requestid after a 409 is evaluated again | sad | functional | Deviations (rollback) |
| TC-BUG-10-13 | IdentifiedCommandHandler rethrows domain exceptions only | sad | unit | Deviations (handler) |
| TC-BUG-10-14 | A false result for an existing order stays 500 | sad | unit | Decisions (others stay 500) |
| TC-BUG-10-15 | Order creation still returns 200 on a domain exception | sad | unit | Deviations (CreateOrderAsync) |

Existing tests `CancelNonExistentOrderFails` and `ShipNonExistentOrderFails` in `tests/Ordering.FunctionalTests/OrderingApiTests.cs` assert 500 and must be updated to 404 (TC-05, TC-06).

## Out of scope

- The `ordering-two-buyers` scenario, `testing/` folder and `e2e/teststack/ordering-api.spec.ts` (the `test.fixme` removal and bugs-table row): these do not exist in this repository (see the story's dogfood note). TC-01 stands in for the reproduction step.
- Fixing the 200 returned by order creation on failure (BUG-9).

## Open questions

- Ownership: the story does not say whether alice may cancel or ship bob's order, so no case was written.
- Cancelling an already Cancelled order: `SetCancelledStatus` allows it, the story is silent, so no case was written.
- Duplicate `x-requestid` after a successful change: unchanged behavior, not specified, no case.
- Functional cases need orders in specific statuses; they are seeded through the ordering DbContext in the fixture, since the default scenario has no orders.
