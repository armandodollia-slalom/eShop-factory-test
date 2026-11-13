---
story: BUG-18
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/35"
story-sha: 26d8481cf7be
plan-sha: 7090887517c7
verified-score: 10
verified-at: "2026-11-13T21:31:50.917Z"
verified-by: test-planner@a978a288/27d172f2
automation-sha: 6ecbfc59736a
automation-plan-sha: 7090887517c7
automation-score: 9
automation-verified-at: "2026-11-13T21:51:24.797Z"
---
# Test plan: BUG-18 [BE - Catalog.API] - Creating a catalog item with an existing id returns 500

Scope: `POST /api/catalog/items` must answer `409 Conflict` (ProblemDetails) when the body carries an id that already exists, on api-version 1.0 and 2.0, without writing anything. Id 0 or omitted still generates an id; an unused explicit id is honoured. All cases run at the functional layer against the real Postgres of `CatalogApiFixture`.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-18-01 | POST with an existing id returns 409 Conflict on api-version 2.0 | sad | functional | Expected 409; Steps to Reproduce 1 |
| TC-BUG-18-02 | POST with an existing id returns 409 Conflict on api-version 1.0 | sad | functional | Code map: v1 and v2 |
| TC-BUG-18-03 | A rejected duplicate does not modify the existing item or add a row | sad | functional | Expected 409; Actual PK violation |
| TC-BUG-18-04 | POST with id 0 still creates the item with a generated id | happy | functional | Decisions: id 0 generated |
| TC-BUG-18-05 | POST with the id omitted creates the item with a generated id | happy | functional | Decisions: omitted id generated |
| TC-BUG-18-06 | POST with an unused explicit id creates the item under that id | happy | functional | Decisions: explicit id kept |
| TC-BUG-18-07 | Creating the same new explicit id twice: second call is 409 | sad | functional | Expected 409 |

## Out of scope

- Concurrent inserts of the same id (documented as not race-proof in Implementation Notes).
- Removing the `test.fixme` marker in `e2e/teststack/catalog-admin.spec.ts` and the `testing/flows/` bugs table row (files do not exist in this repository).
- Validation errors (BUG-17), and update/delete endpoints.

## Open questions

- The acceptance criteria reference the `catalog-edge` scenario, `testing/` and an e2e spec that do not exist in this repo; cases use the `default` scenario at the functional layer.
- Precedence when a body has both an existing id and an invalid name (400 vs 409) is not stated; no case written.
- Whether a negative id should be treated as "generate" or checked for existence is not stated; no case written.
- Exact `detail`, `title` and content-type of the 409 body are not specified by the story; cases assert only status 409 and a ProblemDetails body with `status` 409.
