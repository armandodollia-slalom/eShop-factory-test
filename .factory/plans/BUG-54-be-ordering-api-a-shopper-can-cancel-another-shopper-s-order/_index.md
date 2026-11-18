---
story: BUG-54
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/296"
story-sha: e871b9367b36
plan-sha: f03c61a1aa20
verified-score: 10
verified-at: "2026-11-18T19:59:18.090Z"
verified-by: test-planner@c9e755e4/council
automation-sha: 10383df46219
automation-plan-sha: f03c61a1aa20
automation-score: 10
automation-verified-at: "2026-11-18T20:16:26.791Z"
---
# Test plan: BUG-54 [BE - Ordering API] - A shopper can cancel another shopper's order

Scope: `PUT /api/orders/cancel?api-version=1.0` on the Ordering API. A signed-in shopper must not be able to cancel an order that belongs to another shopper, the refusal must not reveal whether the order exists, the other shopper's order must keep its status, and the owner's own cancel and the anonymous 401 must behave as before. Every case needs an order created for `alice` (the Ordering functional host cannot save an order, and its auto-authorize middleware always signs requests in), so all cases run on the `e2e` layer as API calls on the test stack with real Identity tokens for `alice` and `bob`. Data: scenario `default` (alice and bob, no orders); each case creates the orders it needs with `POST /api/orders?api-version=1.0` and acts within the order grace period (`GracePeriodTime`, 1 minute in `src/OrderProcessor/appsettings.json`), so a new order is still `Submitted`.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-54-01 | alice cancels her own Submitted order: 200 and the order reads Cancelled | happy | e2e | Expected: alice can still cancel her own order exactly as today |
| TC-BUG-54-03 | alice's order is still Submitted after bob's refused cancel | sad | e2e | Step 4; Expected: alice's order keeps the status it had |
| TC-BUG-54-04 | bob, who has an order of his own, cancelling alice's order is refused with 404 and alice's order stays Submitted | sad | e2e | Expected: step 3 is refused (caller with a buyer record) |
| TC-BUG-54-05 | bob's refusal for alice's order matches his answer for a missing order, before and after bob has an order of his own | sad | e2e | Steps 2-3; Expected: step 3 is refused; the answer does not reveal whether that order exists |
| TC-BUG-54-06 | A cancel request without a token is refused with 401 and alice's order stays Submitted | sad | e2e | Expected: a request without a token is still refused with 401 |
| TC-BUG-54-07 | alice can still cancel her order after bob's refused attempt on it | happy | e2e | Expected: alice can still cancel her own order exactly as today (after step 3) |

## Out of scope

- The WebApp's My orders page (step 4 allows the API read instead; the defect and fix are in the Ordering API only).
- `GET /api/orders/{id}` by a non-owner and the ship endpoint: the story is about cancel only.
- The empty `x-requestid` 400 and the save-failure 500 named in the Implementation Notes: the ticket's Expected does not mention them; existing functional tests (`CancelWithEmptyGuidFails`) already cover the 400.
- The payment-failed system cancel (`SetPaymentFailedOrderStatusCommand`) added on the branch: not part of the ticket's Expected behaviour.

## Open questions

- Whether bob retrying a refused cancel with the same `x-requestid` must again answer 404 (the notes say nothing is persisted on refusal, but the ticket does not define idempotency of a refused request).
- The ticket requires the refusal not reveal existence but does not name a status code; the cases use the 404 with empty body recorded in the Implementation Notes as the concrete answer, and TC-BUG-54-05 checks that both answers are the same 404 with an empty body, for a caller without and with a buyer record.
- Status checks rely on acting within the 1-minute grace period; after it the order processor may move alice's order to AwaitingValidation and beyond, which the story does not address.
