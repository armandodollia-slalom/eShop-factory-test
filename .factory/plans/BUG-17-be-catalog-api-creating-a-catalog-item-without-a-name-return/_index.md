---
story: BUG-17
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/34"
story-sha: 6bc36d7c5316
plan-sha: dccdd7aa9876
verified-score: 9
verified-at: "2026-11-13T22:31:35.006Z"
verified-by: test-planner@a978a288/27d172f2
automation-sha: c3b8dc2bf32b
automation-plan-sha: dccdd7aa9876
automation-score: 10
automation-verified-at: "2026-11-13T23:35:57.757Z"
---
# Test plan: BUG-17 [BE - Catalog.API] - Creating a catalog item without a name returns 500

Scope: `POST /api/catalog/items` must answer 400 with a ProblemDetails body when the name is missing, null, empty or whitespace, persist nothing, and still create items with a valid name. The shared name validation is also checked on `PUT /api/catalog/items` (v1) and `PUT /api/catalog/items/{id}` (v2). All cases are functional, in `tests/Catalog.FunctionalTests`, on the `default` scenario; no new scenario is needed.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-17-01 | POST create item with no name property returns 400, not 500 | sad | functional | Expected: 400 BadRequest with a validation problem, Steps to Reproduce 1 |
| TC-BUG-17-02 | POST create item with name null returns 400 | sad | functional | Expected: 400 BadRequest with a validation problem |
| TC-BUG-17-03 | POST create item with empty name returns 400 | sad | functional | Decisions: empty name rejected |
| TC-BUG-17-04 | POST create item with whitespace-only name returns 400 | sad | functional | Decisions: whitespace name rejected |
| TC-BUG-17-05 | Rejected create does not add a catalog row | sad | functional | Decisions: rejected before any database access |
| TC-BUG-17-06 | POST create item with a valid name still returns 201 | happy | functional | Decisions: shared validation must not reject valid names |
| TC-BUG-17-07 | PUT v2 update with blank name returns 400 and leaves the item unchanged | sad | functional | Decisions: shared validator for create and update, Code map: PUT v2 /items/{id} |
| TC-BUG-17-08 | PUT v1 update with no name returns 400 and leaves the item unchanged | sad | functional | Decisions: shared validator for create and update, Code map: PUT v1 /items |

## Out of scope

- The Playwright spec `e2e/teststack/catalog-admin.spec.ts` and the `catalog-edge` scenario do not exist in this repository (see the story banner), so no e2e case is written.
- Removing the `test.fixme` marker and the bugs-table row in `testing/flows/` are repository chores, not behavior.
- Negative price, duplicate id and unknown brand/type are separate stories (BUG-13, BUG-18, BUG-19).

## Open questions

- Acceptance criteria reference `testing/teststack`, `catalog-edge` and `e2e/teststack/catalog-admin.spec.ts`, which are absent here; the steps are mapped to the functional layer on `default`.
- The story says only "400 with a validation problem"; the exact `detail` text and the response content type are not specified, so cases assert only status and a non-empty `detail`.
- Concurrent creates are undefined by the story.
