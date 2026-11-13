---
story: BUG-17
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/34"
story-sha: 774b15159af3
plan-sha: 05c6062eb4ec
verified-score: 9
verified-at: "2026-11-13T19:17:29.930Z"
verified-by: test-planner@a978a288/27d172f2
automation-sha: 82da330e9f48
automation-plan-sha: 05c6062eb4ec
automation-score: 10
automation-verified-at: "2026-11-13T19:25:55.368Z"
---
# Test plan: BUG-17 [BE - Catalog.API] - Creating a catalog item without a name returns 500

Scope: `POST /api/catalog/items` must answer `400 BadRequest` with a validation problem (error for `Name`) when the name is missing, null, empty or whitespace, instead of `500` from the Postgres NOT NULL violation. Rejected requests save nothing; valid bodies keep returning 201 with a Location header. All cases are functional (API contract against real Postgres).

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-17-01 | Body without a name property is rejected with 400 (api-version 2.0) | sad | functional | Expected 400, Actual 500 |
| TC-BUG-17-02 | Body without a name is rejected with 400 under api-version 1.0 | sad | functional | v1 and v2 endpoint |
| TC-BUG-17-03 | Explicit null name is rejected with 400 | sad | functional | Missing Name |
| TC-BUG-17-04 | Empty-string name is rejected with 400 | sad | functional | Empty Name |
| TC-BUG-17-05 | Whitespace-only name is rejected with 400 | sad | functional | Whitespace Name |
| TC-BUG-17-06 | A rejected nameless request leaves the catalog unchanged | sad | functional | Nothing saved |
| TC-BUG-17-07 | Valid body still returns 201 with Location and persists the item | happy | functional | Valid body unchanged |
| TC-BUG-17-08 | One-character name is accepted (just inside the boundary) | happy | functional | Only blank names rejected |

## Out of scope

- The `testing/` folder, `testing/teststack`, the `catalog-edge` scenario, `e2e/teststack/catalog-admin.spec.ts` and removing a bugs-table row: they do not exist in this repository (dogfood copy); the acceptance steps map to the functional cases above.
- Update validation (BUG-13), client-supplied duplicate id (BUG-18), unknown brand/type (BUG-19).
- UI flows: the story has no user-visible browser behavior.

## Open questions

- The exact error message text and the casing of the `Name` key in `errors` are not specified; cases only check the key `Name` and a non-empty message list.
- Behavior for a nameless body that is also invalid in other ways (negative price) is undefined; no case.
