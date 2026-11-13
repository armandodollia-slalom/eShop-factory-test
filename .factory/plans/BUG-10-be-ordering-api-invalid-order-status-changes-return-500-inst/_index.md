---
story: BUG-10
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/22"
story-sha: a7bb56e3f52a
plan-sha: 86e81df46d52
verified-score: 9
verified-at: "2026-11-13T17:20:52.929Z"
verified-by: test-planner@a978a288/27d172f2
automation-sha: 1e630cf85899
automation-plan-sha: 86e81df46d52
automation-score: 10
automation-verified-at: "2026-11-13T17:37:55.599Z"
---
# Test plan: BUG-10 [BE - Ordering.API] Invalid order status changes return 500 instead of a client error

Scope: `PUT /api/orders/cancel` and `PUT /api/orders/ship` must return 409 for order-state rule violations, 400 for validation failures, 404 for nonexistent orders, and keep the 200 and empty-request-id 400 behavior. Retry semantics with the same `x-requestid` are covered. Functional cases need these orders for alice, seeded by the functional fixture or a scenario that `extends: default`: 5 (Shipped), 6 (Paid) and 7 (Submitted) are read-only (only rejected requests touch them, so their state never changes and case order does not matter); orders 8 (Submitted, TC-11), 9 (Paid, TC-12) and 10 (Submitted, TC-13) are dedicated to the mutating success cases, one order per case, so no case depends on run order. Cases 05 and 06 supersede the stale 500 assertions in `CancelNonExistentOrderFails` and `ShipNonExistentOrderFails` in `tests/Ordering.FunctionalTests/OrderingApiTests.cs`.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-10-01 | Cancelling a Shipped order returns 409 with the domain message, not 500 | sad | functional | Expected: 409 for cancelling a Shipped order |
| TC-BUG-10-02 | Cancelling a Paid order returns 409 | sad | functional | Technical Notes: SetCancelledStatus rule violation |
| TC-BUG-10-03 | Shipping an order that is not Paid (Submitted) returns 409 | sad | functional | Technical Notes: SetShippedStatus rule violation |
| TC-BUG-10-04 | Shipping an already Shipped order returns 409 | sad | functional | Technical Notes: SetShippedStatus rule violation |
| TC-BUG-10-05 | Cancelling a nonexistent order returns 404 | sad | functional | Suggested fix: return 404 when the order does not exist |
| TC-BUG-10-06 | Shipping a nonexistent order returns 404 | sad | functional | Suggested fix: return 404 when the order does not exist |
| TC-BUG-10-07 | Cancel with orderNumber 0 returns 400 with the validation message | sad | functional | Implementation Notes: validation failures map to 400 |
| TC-BUG-10-08 | Ship with orderNumber 0 returns 400 with the validation message | sad | functional | Implementation Notes: validation failures map to 400 |
| TC-BUG-10-09 | Cancel with an empty x-requestid still returns 400 | sad | functional | Implementation Notes: empty x-requestid unchanged |
| TC-BUG-10-10 | Ship with an empty x-requestid still returns 400 | sad | functional | Implementation Notes: empty x-requestid unchanged |
| TC-BUG-10-11 | Cancelling a Submitted order succeeds with 200 | happy | functional | Implementation Notes: success -> 200 |
| TC-BUG-10-12 | Shipping a Paid order succeeds with 200 | happy | functional | Implementation Notes: success -> 200 |
| TC-BUG-10-13 | Repeating a successful cancel with the same x-requestid returns 200 and changes nothing | sad | functional | Implementation Notes: duplicate request id -> 200 |
| TC-BUG-10-14 | Retrying a rejected cancel with the same x-requestid returns 409 again, not a false 200 | sad | functional | Implementation Notes: retry after a failed cancel/ship |
| TC-BUG-10-15 | Retrying a cancel for a nonexistent order with the same x-requestid returns 404 both times | sad | functional | Implementation Notes: not-found can be retried with same request id |
| TC-BUG-10-16 | OrdersApi maps OrderingDomainException to 409 and a validation-wrapped one to 400 | sad | unit | Implementation Notes: 409 vs 400 mapping in OrderRuleViolation |
| TC-BUG-10-17 | IdentifiedCommandHandler rethrows OrderingDomainException for cancel/ship but swallows it for create order | sad | unit | Implementation Notes: IdentifiedCommandHandler rethrows only for opted-in handlers |

## Out of scope

- The `test.fixme` spec `e2e/teststack/ordering-api.spec.ts`, `testing/flows/` bug table and the `ordering-two-buyers` scenario: they do not exist in this repository (dogfood note).
- Create-order behavior (BUG-9) beyond the handler opt-in guard in TC-BUG-10-17.
- Browser/UI flows: the story is backend only.

## Open questions

- Authentication (no token / another user's order) for cancel and ship is not stated by the story; no case written.
- Exact 400 message for the ship validator and concurrent cancel/ship of the same order are undefined by the story; no case for concurrency.
- Expected message text for 409 is "such as" in the story; cases use the domain exception message from `Order.cs`.
