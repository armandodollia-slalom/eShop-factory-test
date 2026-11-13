---
story: BUG-10
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/22"
story-sha: 79694346c46a
plan-sha: 754ae01684a4
verified-score: 9
verified-at: "2026-11-13T10:48:29.468Z"
verified-by: test-planner@a978a288/27d172f2
automation-sha: 02730925a33c
automation-plan-sha: 754ae01684a4
automation-score: 9
automation-verified-at: "2026-11-13T10:59:02.966Z"
---
# Test plan: BUG-10 [BE - Ordering.API] - Invalid order status changes return 500 instead of a client error

Scope: `PUT /api/orders/cancel` and `PUT /api/orders/ship` in Ordering.API. Rule violations (`OrderingDomainException`) return 409 with `ProblemDetails`, command validation failures return 400, a missing order returns 404, and the success and empty-`x-requestid` paths are unchanged. All cases are functional (Ordering.FunctionalTests, real Postgres) because the behavior is an HTTP status mapping. Cases that need orders use a new scenario `ordering-statuses` (`extends: default`) with alice's orders: 1 Submitted, 2 Paid, 3 Shipped, 4 Cancelled.

Existing tests `CancelNonExistentOrderFails` and `ShipNonExistentOrderFails` assert 500 and must be changed to 404 (TC-BUG-10-05, -06).

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-10-01 | Cancelling a Shipped order returns 409 with the domain message | sad | functional | Expected 409, Steps to Reproduce |
| TC-BUG-10-02 | Cancelling a Paid order returns 409 | sad | functional | SetCancelledStatus rule |
| TC-BUG-10-03 | Shipping a Submitted order returns 409 | sad | functional | SetShippedStatus rule |
| TC-BUG-10-04 | Shipping an already Shipped order returns 409 | sad | functional | SetShippedStatus rule |
| TC-BUG-10-05 | Cancelling a nonexistent order returns 404 | sad | functional | 404 for missing order |
| TC-BUG-10-06 | Shipping a nonexistent order returns 404 | sad | functional | 404 for missing order |
| TC-BUG-10-07 | Cancel with order number 0 returns 400 | sad | functional | Validation maps to 400 |
| TC-BUG-10-08 | Cancel with empty x-requestid still returns 400 | sad | functional | 400 unchanged |
| TC-BUG-10-09 | Ship with empty x-requestid still returns 400 | sad | functional | 400 unchanged |
| TC-BUG-10-10 | Cancelling a Submitted order still returns 200 | happy | functional | 200 unchanged |
| TC-BUG-10-11 | Shipping a Paid order still returns 200 | happy | functional | 200 unchanged |
| TC-BUG-10-12 | Retry with the same x-requestid after a 409 is re-evaluated | sad | functional | Rollback of idempotency row |

## Out of scope

- The Playwright spec `e2e/teststack/ordering-api.spec.ts` (`test.fixme` removal) and the `testing/flows/` bugs table: they do not exist in this repository.
- Create-order behavior (BUG-9).

## Open questions

- Authentication (no token) and ownership (cancelling another user's order) are not specified by the story; no cases written.
- Cancelling an already Cancelled order: the domain rule permits it, the story does not say what the API returns; no case.
- Behavior of unexpected failures (the retained 500 path) is not specified; no case.
- Exact 400 body for validation failures is not specified beyond "the validation messages".
