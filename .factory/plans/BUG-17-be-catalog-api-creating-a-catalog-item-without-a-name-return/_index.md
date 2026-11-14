---
story: BUG-17
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/34"
story-sha: e035036c51a1
plan-sha: 91925ef8f691
verified-score: 9
verified-at: "2026-11-14T02:21:29.317Z"
verified-by: test-planner@476d82b5/27d172f2
automation-sha: 307828687b4f
automation-plan-sha: 91925ef8f691
automation-score: 9
automation-verified-at: "2026-11-14T02:41:43.781Z"
---
# Test plan: BUG-17 [BE - Catalog.API] - Creating a catalog item without a name returns 500

Scope: `POST /api/catalog/items` without a `name` must return `400 BadRequest` with a ProblemDetails body instead of a 500 from Postgres, store nothing, and the same required-field validation applies to both PUT update routes (shared validator). Valid create and update keep working. All cases are functional (`tests/Catalog.FunctionalTests`, existing `CatalogApiFixture`).

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-17-01 | POST without a name property returns 400 | sad | functional | Expected 400; reproduction step 1 |
| TC-BUG-17-02 | POST with name set to null returns 400 | sad | functional | Expected 400 |
| TC-BUG-17-03 | Rejected nameless POST stores no item | sad | functional | Validate before saving |
| TC-BUG-17-04 | POST with a name still returns 201 with Location | happy | functional | Regression |
| TC-BUG-17-05 | PUT v2 without a name returns 400 and leaves the item unchanged | sad | functional | Shared validator |
| TC-BUG-17-06 | PUT v1 without a name returns 400 | sad | functional | Shared validator |
| TC-BUG-17-07 | PUT v2 with a name still updates the item | happy | functional | Regression |

## Out of scope

- Removing the `test.fixme` marker in `e2e/teststack/catalog-admin.spec.ts` and the bugs-table row in `testing/flows/`: those files do not exist in this repository.
- Negative price, unknown brand/type and duplicate id (BUG-13, BUG-18, BUG-19).

## Open questions

- Empty (`""`) and whitespace-only names: the story says only "without a name"; the implementation also rejects them, but the story does not state it, so no case.
- Exact `detail` text and response content type of the 400 body: the story says only "a validation problem", so cases assert status and a non-empty ProblemDetails body.
- Nameless PUT for an unknown id (400 vs 404): not stated by the story.
