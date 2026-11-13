---
story: BUG-18
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/35"
story-sha: fdbfafe19a83
plan-sha: 19fef54591d8
verified-score: 9
verified-at: "2026-11-13T19:34:27.643Z"
verified-by: test-planner@a978a288/27d172f2
automation-sha: 517e325b5f65
automation-plan-sha: 19fef54591d8
automation-score: 9
automation-verified-at: "2026-11-13T19:43:26.047Z"
---
# Test plan: BUG-18 [BE - Catalog.API] - Creating a catalog item with an existing id returns 500

Scope: `POST /api/catalog/items` (api-version 1.0 and 2.0) must answer `409 Conflict` when the body `id` belongs to an existing item, instead of `500` from the Postgres primary key violation. A rejected request saves nothing. Body id 0 (or no id) still gets a database-generated id and a new non-zero id keeps being accepted. All cases are functional (API contract against real Postgres).

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-18-01 | Existing id is rejected with 409 (api-version 2.0) | sad | functional | Expected 409, Actual 500 |
| TC-BUG-18-02 | Existing id is rejected with 409 (api-version 1.0) | sad | functional | v1 and v2 endpoint |
| TC-BUG-18-03 | Rejected duplicate leaves existing item and catalog unchanged | sad | functional | Nothing overwritten or added |
| TC-BUG-18-04 | Highest seeded id (101) is rejected with 409 | sad | functional | Existence check, boundary |
| TC-BUG-18-05 | Second create with the same new id returns 201 then 409 | sad | functional | Items created via the API conflict too |
| TC-BUG-18-06 | Body id 0 is accepted and the id is generated | happy | functional | Decision: id 0 keeps generating |
| TC-BUG-18-07 | New non-zero id that does not exist yet is accepted | happy | functional | Decision: unused id still accepted |
| TC-BUG-18-08 | Body without an id property is created with a generated id | happy | functional | Decision: absent id keeps working |

## Out of scope

- The `testing/` folder, `testing/teststack`, the `catalog-edge` scenario, `e2e/teststack/catalog-admin.spec.ts`, removing the `test.fixme` marker and the bugs-table row: they do not exist in this repository (dogfood copy); the acceptance steps map to the functional cases above.
- The "ignore the client id" alternative: the story's Decisions chose 409.
- Missing or blank name (BUG-17) and unknown brand/type (BUG-19).
- UI flows: no user-visible browser behavior.

## Open questions

- The 409 body shape and detail text are not specified by the story; cases check only the status code.
- Behavior for a negative id is undefined (the implementation only checks ids greater than 0); no case.
- Which check wins when a body has both an existing id and a blank name is undefined; no case.
- Concurrent creates with the same id (race between the existence check and the save) are undefined; no case.
