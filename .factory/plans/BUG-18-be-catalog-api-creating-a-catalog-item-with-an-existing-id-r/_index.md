---
story: BUG-18
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/35"
story-sha: f6d99a14c6bd
plan-sha: ea8775d73c15
verified-score: 9
verified-at: "2026-11-13T23:05:45.912Z"
verified-by: test-planner@a978a288/27d172f2
automation-sha: 6b2715b503dc
automation-plan-sha: ea8775d73c15
automation-score: 10
automation-verified-at: "2026-11-13T23:40:47.244Z"
---
# Test plan: BUG-18 Catalog API creating a catalog item with an existing id returns 500

Scope: `POST /api/catalog/items` when the body carries an `id` that already exists must return 409 Conflict (ProblemDetails) instead of 500, without changing data; creates with an unused or absent id keep working. All cases are functional tests on Catalog.API against real Postgres.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-18-01 | POST create item with an existing id returns 409 Conflict, not 500 | sad | functional | Expected: 409 Conflict, Steps to Reproduce 1 |
| TC-BUG-18-02 | Rejected duplicate-id create does not modify the existing item or add rows | sad | functional | Expected: 409 Conflict (no overwrite) |
| TC-BUG-18-03 | POST create with an existing id returns 409 under api-version 1.0 too | sad | functional | Expected: 409 Conflict |
| TC-BUG-18-04 | POST create with an unused explicit id returns 201 and keeps that id | happy | functional | Expected: client ids that do not collide are accepted |
| TC-BUG-18-05 | POST create with no id returns 201 with a database-generated id | happy | functional | Expected: id absent lets database generate one |
| TC-BUG-18-06 | Creating the same new explicit id twice returns 201 then 409 | sad | functional | Expected: 409 Conflict, Steps to Reproduce 1 |

## Out of scope

- `e2e/teststack/catalog-admin.spec.ts` and `testing/flows/` do not exist in this repository, so no e2e case or bugs-table change.
- Concurrent creates with the same id (undefined by the story).

## Open questions

- Negative ids: the story does not say whether they are treated as absent; no case written.
- Precedence of name validation (400) versus the id conflict (409) when both apply is not stated; no case written.
