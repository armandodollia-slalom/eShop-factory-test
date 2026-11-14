---
story: BUG-15
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/75"
story-sha: 7f4380a634ef
plan-sha: 496ffc355000
verified-score: 9
verified-at: "2026-11-14T20:03:41.052Z"
verified-by: test-planner@476d82b5/27d172f2
automation-sha: e13a617c0775
automation-plan-sha: 496ffc355000
automation-score: 9
automation-verified-at: "2026-11-14T20:36:54.452Z"
---
# Test plan: BUG-15 [BE - Ordering.API] - Creating an order draft without a body returns 500

Scope: `POST /api/orders/draft` in Ordering.API. A missing body, a body of `{}`, and a body whose `Items` is null or empty must return `400` as `application/problem+json`. A draft with at least one item keeps returning `200`. All cases are functional (`tests/Ordering.FunctionalTests`, existing `OrderingApiFixture`).

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-15-01 | Draft request without a body is rejected with 400 | sad | functional | Expected 400; reproduction step |
| TC-BUG-15-02 | Rejection of a missing body is an application/problem+json response | sad | functional | Decisions: problem details |
| TC-BUG-15-03 | Draft request with body `{}` is rejected with 400 | sad | functional | Decisions: `{}` rejected |
| TC-BUG-15-04 | Draft request with an empty Items list is rejected with 400 | sad | functional | Items empty boundary |
| TC-BUG-15-05 | Draft request with Items null is rejected with 400 | sad | functional | Items null |
| TC-BUG-15-06 | A valid draft still returns 200 with the order draft | happy | functional | Regression |

## Out of scope

- The Playwright spec `e2e/teststack/ordering-api.spec.ts` and the `testing/flows/` bugs table: the story's own note says they do not exist in this repository.
- Unauthenticated callers (401): the functional fixture auto-authorizes every request and the story does not change authorization.

## Open questions

- The exact problem-details `title` and `detail` text is not specified by the story, so cases assert only status, content type and non-empty body.
- The story's reproduction uses port 18084 on the test stack as alice; the functional layer substitutes the fixture's fixed identity, which is equivalent for this behavior.
