---
story: BUG-15
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/75"
story-sha: ee988078dcb0
plan-sha: d0fad113f2fd
verified-score: 9
verified-at: "2026-11-14T16:08:17.073Z"
verified-by: test-planner@476d82b5/27d172f2
automation-sha: 48f192f17ccd
automation-plan-sha: d0fad113f2fd
automation-score: 10
automation-verified-at: "2026-11-14T16:26:43.287Z"
---
# Test plan: BUG-15 [BE - Ordering.API] - Creating an order draft without a body returns 500

Scope: `POST /api/orders/draft` must answer 400 problem details (`application/problem+json`, detail "An order draft requires at least one item.") for a missing body, a JSON null body, null Items and empty Items, and keep returning 200 for a valid draft. All cases run at the functional layer in `tests/Ordering.FunctionalTests`.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-15-01 | Draft request with no body is rejected with 400 | sad | functional | Expected 400; missing body |
| TC-BUG-15-02 | JSON null body is rejected with 400 | sad | functional | JSON null body |
| TC-BUG-15-03 | Body with null Items is rejected with 400 | sad | functional | null Items |
| TC-BUG-15-04 | Body with empty Items is rejected with 400 | sad | functional | empty Items boundary |
| TC-BUG-15-05 | Draft with exactly one item still returns 200 with the computed draft | happy | functional | 200 body unchanged |

## Out of scope

- The Playwright spec `e2e/teststack/ordering-api.spec.ts`, its `test.fixme` marker and the `testing/flows/` bugs table: they do not exist in this repository.
- Authentication and ownership of the draft endpoint (unchanged by this bug).

## Open questions

- The story does not say what happens for a body with a missing buyerId or items with zero quantity; no case written.
