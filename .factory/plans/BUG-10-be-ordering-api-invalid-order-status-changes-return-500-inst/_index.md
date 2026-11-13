---
story: BUG-10
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/22"
story-sha: 926881a45ee4
plan-sha: 8b9024bf2b22
verified-score: 9
verified-at: "2026-11-13T14:38:46.811Z"
verified-by: test-planner@a978a288/27d172f2
automation-sha: 61058bc293fd
automation-plan-sha: 8b9024bf2b22
automation-score: 10
automation-verified-at: "2026-11-13T15:02:00.740Z"
---
# Test plan: BUG-10 [BE - Ordering.API] - Invalid order status changes return 500 instead of a client error

Scope: PUT `/api/orders/cancel` and `/api/orders/ship` must map domain rule violations to 409, unknown orders to 404, keep invalid commands at 400 and server faults at 500; create-order is unchanged. Functional cases run against Ordering.API with orders seeded in the test database; unit cases cover the handler and endpoint mapping. The story's e2e spec and `testing/flows/` items do not exist in this repository.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-10-01 | Cancel Shipped order returns 409 | sad | functional | Expected, Decisions |
| TC-BUG-10-02 | Cancel Paid order returns 409 | sad | functional | SetCancelledStatus Paid |
| TC-BUG-10-03 | Ship non-Paid order returns 409 | sad | functional | SetShippedStatus |
| TC-BUG-10-04 | Ship already Shipped order returns 409 | sad | functional | SetShippedStatus |
| TC-BUG-10-05 | Cancel unknown order returns 404 | sad | functional | Suggested fix 404 |
| TC-BUG-10-06 | Ship unknown order returns 404 | sad | functional | Suggested fix 404 |
| TC-BUG-10-07 | Rejected cancel leaves order unchanged | sad | functional | Transaction rollback |
| TC-BUG-10-08 | Retry with same request id is reprocessed | sad | functional | Idempotency rollback |
| TC-BUG-10-09 | Cancel with empty request id returns 400 | sad | functional | Existing behavior |
| TC-BUG-10-10 | Ship with empty request id returns 400 | sad | functional | Existing behavior |
| TC-BUG-10-11 | Cancel cancellable order returns 200 | happy | functional | Success path |
| TC-BUG-10-12 | Ship Paid order returns 200 | happy | functional | Success path |
| TC-BUG-10-13 | Handler rethrows non-domain exception | sad | unit | Decisions (500 not 404) |
| TC-BUG-10-14 | Handler passes domain exception through | sad | unit | Decisions |
| TC-BUG-10-15 | Endpoints map domain exception to 409 | sad | unit | OrderStatusChangeProblem |
| TC-BUG-10-16 | Wrapped ValidationException maps to 400 | sad | unit | OrderStatusChangeProblem |
| TC-BUG-10-17 | False result maps to 404 | sad | unit | Decisions |
| TC-BUG-10-18 | CreateOrder unchanged on exception | sad | unit | Deviations |

## Out of scope

- The e2e spec `ordering-api.spec.ts`, `test.fixme` removal and `testing/flows/` bug table (absent in this repository).
- Changing create-order behavior (BUG-9).

## Open questions

- Authentication (no token) and ownership (cancelling another user's order) are not stated by the story; no cases written. The functional fixture auto-authorizes requests.
- Concurrent cancel/ship of the same order and exact ProblemDetails fields beyond `detail` are undefined.
