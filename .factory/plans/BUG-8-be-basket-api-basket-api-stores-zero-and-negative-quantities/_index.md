---
story: BUG-8
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/63"
story-sha: faf02c2bc948
plan-sha: 5e96d8f3975e
verified-score: 9
verified-at: "2026-11-14T10:43:40.024Z"
verified-by: test-planner@476d82b5/27d172f2
automation-sha: 7496ae03c71f
automation-plan-sha: 5e96d8f3975e
automation-score: 9
automation-verified-at: "2026-11-14T11:16:17.136Z"
---
# Test plan: BUG-8 [BE - Basket.API] - Basket.API stores zero and negative quantities

Scope: gRPC `BasketApi.UpdateBasket` must reject any line with quantity below 1 with `INVALID_ARGUMENT`, after the auth check and before any repository write, so Redis stays unchanged. Valid quantities keep working.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-8-01 | Quantities -3 and 0 rejected, nothing saved | sad | unit | Expected INVALID_ARGUMENT |
| TC-BUG-8-02 | Quantity 0 rejected | sad | unit | Quantity < 1 boundary |
| TC-BUG-8-03 | Quantity -1 rejected | sad | unit | Quantity < 1 boundary |
| TC-BUG-8-04 | Quantity 1 accepted and saved | happy | unit | Valid lower boundary |
| TC-BUG-8-05 | Mixed valid and invalid rejects whole request | sad | unit | Redis unchanged |
| TC-BUG-8-06 | Message lists every invalid product | sad | unit | Decisions: one message |
| TC-BUG-8-07 | Anonymous caller gets UNAUTHENTICATED first | sad | unit | Auth before validation |
| TC-BUG-8-08 | Rejected update leaves Redis basket unchanged | sad | functional | Expected: Redis unchanged |

## Out of scope

- The ACs about `e2e/teststack/basket-api.spec.ts`, `test.fixme` removal and the `testing/flows/` bugs table: these files do not exist in this repository.
- GetBasket and DeleteBasket behavior (unchanged).

## Open questions

- Behavior for an empty items list is not stated; no case written.
- Exact error message text is only given by the implementation notes (TC-BUG-8-06 follows them); the story's Expected only states `INVALID_ARGUMENT`.
- Duplicate productIds, very large quantities and concurrent updates are not specified.
