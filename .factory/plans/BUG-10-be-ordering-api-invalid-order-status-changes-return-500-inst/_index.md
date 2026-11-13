---
story: BUG-10
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/22"
story-sha: 79694346c46a
plan-sha: 622cf9114456
verified-score: 9
verified-at: "2026-11-13T12:27:13.407Z"
verified-by: test-planner@a978a288/27d172f2
automation-sha: b8a51ef97ba2
automation-plan-sha: 622cf9114456
automation-score: 10
automation-verified-at: "2026-11-13T12:45:43.157Z"
---
# Test plan: BUG-10 [BE - Ordering.API] - Invalid order status changes return 500 instead of a client error

Scope: `PUT /api/orders/cancel` and `PUT /api/orders/ship` must map an invalid status transition to `409 Conflict` (ProblemDetails with the domain message), a nonexistent order to `404`, a command validation failure to `400`, and keep the success path (`200`) and the empty `x-requestid` `400` unchanged. All cases run at the functional layer (Ordering.FunctionalTests); orders in the required statuses are inserted by the test fixture.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-10-01 | Cancelling a Shipped order returns 409 with the domain message | sad | functional | Expected 409; SetCancelledStatus |
| TC-BUG-10-02 | Cancelling a Paid order returns 409 with the domain message | sad | functional | SetCancelledStatus (Paid) |
| TC-BUG-10-03 | Shipping an order that is not Paid returns 409 with the domain message | sad | functional | SetShippedStatus |
| TC-BUG-10-04 | Shipping an already Shipped order returns 409 | sad | functional | SetShippedStatus (Shipped) |
| TC-BUG-10-05 | Cancelling a nonexistent order returns 404 | sad | functional | Suggested fix: 404 |
| TC-BUG-10-06 | Shipping a nonexistent order returns 404 | sad | functional | Suggested fix: 404 |
| TC-BUG-10-07 | Cancel with order number 0 returns 400 with the validation message | sad | functional | Decisions: validation 400 |
| TC-BUG-10-08 | Ship with order number 0 returns 400 with the validation message | sad | functional | Decisions: validation 400 |
| TC-BUG-10-09 | Cancel with an empty request id still returns 400 | sad | functional | Empty x-requestid unchanged |
| TC-BUG-10-10 | Ship with an empty request id still returns 400 | sad | functional | Empty x-requestid unchanged |
| TC-BUG-10-11 | Cancelling a Submitted order still returns 200 and sets status Cancelled | happy | functional | 200 unchanged |
| TC-BUG-10-12 | Shipping a Paid order still returns 200 and sets status Shipped | happy | functional | 200 unchanged |
| TC-BUG-10-13 | A rejected cancel leaves the Shipped order unchanged | sad | functional | Rule violation, no state change |
| TC-BUG-10-14 | Retrying a rejected cancel with the same request id returns 409 again | sad | functional | Deviations: rollback, retry re-evaluated |

## Out of scope

- The Playwright spec `e2e/teststack/ordering-api.spec.ts`, the `ordering-two-buyers` scenario, `testing/flows/` and `testing/teststack` do not exist in this repository (story's dogfood note); no e2e cases.
- `CreateOrderAsync` returning 200 on failure (BUG-9).
- Existing tests `CancelNonExistentOrderFails` and `ShipNonExistentOrderFails` assert 500 and must be updated to 404 (covered by TC-05, TC-06).

## Open questions

- Does the API restrict cancel/ship to the order's owner (alice cancelling bob's order)? The story does not say; no ownership or auth case written.
- Concurrent status changes on the same order are undefined by the story.
- Exact 400 body shape for validation failures (a plain string per the implementation notes) and the ship validator's message are not specified beyond "validation messages".
