---
story: BUG-18
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/35"
story-sha: 545483a23324
plan-sha: 0d4040341055
verified-score: 9
verified-at: "2026-11-14T02:49:45.512Z"
verified-by: test-planner@476d82b5/27d172f2
automation-sha: 109d58483c41
automation-plan-sha: 0d4040341055
automation-score: 9
automation-verified-at: "2026-11-14T03:07:32.407Z"
---
# Test plan: BUG-18 [BE - Catalog.API] - Creating a catalog item with an existing id returns 500

Scope: `POST /api/catalog/items` with a client-supplied `id` that already exists must return `409 Conflict` with a ProblemDetails body instead of a 500 from Postgres, and must change nothing. Unused explicit ids and id 0 keep creating items; missing-name validation still takes precedence. All cases are functional (`tests/Catalog.FunctionalTests`, existing `CatalogApiFixture`).

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-18-01 | POST with an existing id returns 409 Conflict | sad | functional | Expected 409; reproduction step 1 |
| TC-BUG-18-02 | Rejected duplicate POST leaves item 1 and the catalog count unchanged | sad | functional | No side effects on 409 |
| TC-BUG-18-03 | POST with an unused explicit id returns 201 and keeps that id | happy | functional | Decision: client id still honored |
| TC-BUG-18-04 | Posting the same newly created id twice returns 409 the second time | sad | functional | Duplicate of an API-created id |
| TC-BUG-18-05 | POST with id 0 still creates an item with a server-generated id | happy | functional | Check only when Id != 0 |
| TC-BUG-18-06 | POST without a name and with an existing id returns 400, not 409 | sad | functional | Validation ordering |

## Out of scope

- Removing the `test.fixme` marker in `e2e/teststack/catalog-admin.spec.ts`, the `catalog-edge` scenario and the bugs-table row in `testing/flows/`: those files do not exist in this repository.
- Concurrent inserts of the same id (documented as an uncovered race in the story's Deviations).

## Open questions

- Exact `detail` text and content type of the 409 body: the story says only `409 Conflict`, so cases assert status and a non-empty ProblemDetails body.
- Whether v1 `POST` exists as a separate route: the story reproduces only with `api-version=2.0`, so only that is covered.
