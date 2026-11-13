---
story: BUG-10
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/22"
story-sha: 0092b8c41695
plan-sha: 7a0c42f2d05d
verified-score: 9
verified-at: "2026-11-13T09:27:55.953Z"
verified-by: test-planner@a978a288/27d172f2
automation-sha: 8e6eb227795a
automation-plan-sha: 7a0c42f2d05d
automation-score: 10
automation-verified-at: "2026-11-13T09:36:40.879Z"
---
# Test plan: BUG-10 [BE - Ordering.API] Invalid order status changes return 500 instead of a client error

Scope: `PUT /api/orders/cancel` and `PUT /api/orders/ship` return 409 for status-rule violations, 404 for a missing order, 400 for an empty request id, and still 500 for other command failures; plus the handler and create-order side effects of the fix. Functional cases seed orders with the needed status directly in the Ordering database (the `default` scenario has no orders).

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-10-01 | Cancelling a Shipped order returns 409 with the domain message | sad | functional | Expected 409; reproduction |
| TC-BUG-10-02 | Cancelling a Paid order returns 409 | sad | functional | SetCancelledStatus |
| TC-BUG-10-03 | Shipping an order that is not Paid returns 409 | sad | functional | SetShippedStatus |
| TC-BUG-10-04 | Shipping an already Shipped order returns 409 | sad | functional | SetShippedStatus |
| TC-BUG-10-05 | Cancelling an order that does not exist returns 404 | sad | functional | Missing order 404 |
| TC-BUG-10-06 | Shipping an order that does not exist returns 404 | sad | functional | Missing order 404 |
| TC-BUG-10-07 | Cancel with an empty request id returns 400 before the order lookup | sad | functional | x-requestid first |
| TC-BUG-10-08 | Ship with an empty request id returns 400 before the order lookup | sad | functional | x-requestid first |
| TC-BUG-10-09 | Cancelling a Submitted order still returns 200 and cancels it | happy | functional | Regression |
| TC-BUG-10-10 | Shipping a Paid order still returns 200 and ships it | happy | functional | Regression |
| TC-BUG-10-11 | CancelOrderAsync maps OrderingDomainException to Conflict | sad | unit | InvalidStatusChange |
| TC-BUG-10-12 | ShipOrderAsync maps OrderingDomainException to Conflict | sad | unit | InvalidStatusChange |
| TC-BUG-10-13 | Cancel and ship return NotFound without sending a command when the order is missing | sad | unit | OrderExistsAsync |
| TC-BUG-10-14 | A false command result still returns 500 for cancel and ship | sad | unit | Other failures stay 500 |
| TC-BUG-10-15 | IdentifiedCommandHandler rethrows OrderingDomainException | sad | unit | Deviations |
| TC-BUG-10-16 | IdentifiedCommandHandler still returns default for other exceptions | sad | unit | Deviations |
| TC-BUG-10-17 | CreateOrderAsync still returns Ok when a domain exception is thrown | sad | unit | BUG-9 boundary |

Existing functional tests `CancelNonExistentOrderFails` and `ShipNonExistentOrderFails` assert 500 and are superseded by TC-BUG-10-05 and -06.

## Out of scope

- Editing `testing/flows/` and `e2e/teststack/ordering-api.spec.ts`: they do not exist in this repository (dogfood note).
- The `ordering-two-buyers` scenario and test stack e2e: not present; functional seeding replaces it.
- BUG-9 (create order returning 200 on failure) beyond the non-regression case 17.

## Open questions

- Retrying a rejected transition with the same `x-requestid`: the request record is created before the command runs, so the retry may return the duplicate result (200). The story does not define it; no case.
- Authentication (no token) and ownership (another user's order): the story does not define them, and the functional fixture auto-authorizes; no case.
- Cancelling an already Cancelled order: the domain allows it (200); the story is silent; no case.
