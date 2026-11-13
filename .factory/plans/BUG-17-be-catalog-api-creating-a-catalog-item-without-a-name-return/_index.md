---
story: BUG-17
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/34"
story-sha: 4c3f933e9692
plan-sha: f20afd8a78c2
verified-score: 9
verified-at: "2026-11-13T20:18:01.706Z"
verified-by: test-planner@a978a288/27d172f2
automation-sha: b2d10ec2dac5
automation-plan-sha: f20afd8a78c2
automation-score: 9
automation-verified-at: "2026-11-13T20:44:31.120Z"
---
# Test plan: BUG-17 [BE - Catalog.API] - Creating a catalog item without a name returns 500

Scope: `POST /api/catalog/items` (v1 and v2) must return `400` with a validation problem when `name` is missing, null, empty or whitespace-only, instead of `500`. The shared validator also guards `PUT /api/catalog/items/{id}` (v2) and `PUT /api/catalog/items` (v1). All cases are functional (API against real Postgres); the bug has no UI.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-17-01 | POST without a name field is rejected with 400 (v2) | sad | functional | Expected 400 |
| TC-BUG-17-02 | POST without a name field is rejected with 400 (v1) | sad | functional | Both api versions |
| TC-BUG-17-03 | POST with explicit null name is rejected with 400 | sad | functional | Name null |
| TC-BUG-17-04 | POST with empty-string name is rejected with 400 | sad | functional | Name empty |
| TC-BUG-17-05 | POST with whitespace-only name is rejected with 400 | sad | functional | Name whitespace |
| TC-BUG-17-06 | POST with a valid name still creates the item | happy | functional | Regression |
| TC-BUG-17-07 | PUT v2 without a name is rejected with 400 and the item is unchanged | sad | functional | UpdateItem guard |
| TC-BUG-17-08 | PUT v1 without a name is rejected with 400 and the item is unchanged | sad | functional | UpdateItem guard |

## Out of scope

- Removing the `test.fixme` marker in `e2e/teststack/catalog-admin.spec.ts` and the `testing/flows/` bugs table: those files do not exist in this repository.
- Other validation (negative price, duplicate id, unknown brand/type): BUG-13, BUG-18, BUG-19.

## Open questions

- `PUT` with no name for a non-existent id: validation runs before the lookup so it returns 400, but the story does not state the expected order versus 404; no case written.
- Whether the v1 and v2 `ProblemDetails` content type is `application/json` or `application/problem+json`; cases assert only status and body fields.
