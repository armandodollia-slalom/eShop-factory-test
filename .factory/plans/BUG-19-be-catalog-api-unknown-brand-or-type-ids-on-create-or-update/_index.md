---
story: BUG-19
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/76"
story-sha: 5efa40772757
plan-sha: 7f2212afdb62
verified-score: 9
verified-at: "2026-11-14T16:52:07.153Z"
verified-by: test-planner@476d82b5/27d172f2
automation-sha: 2d394c589c09
automation-plan-sha: 7f2212afdb62
automation-score: 9
automation-verified-at: "2026-11-14T16:59:34.897Z"
---
# Test plan: BUG-19 [BE - Catalog.API] - Unknown brand or type ids on create or update return 500

Scope: Catalog API `POST /api/catalog/items` and `PUT` (v1 `/api/catalog/items`, v2 `/api/catalog/items/{id}`) must answer `400` (`application/problem+json`, naming the unknown id) instead of `500` when `catalogBrandId` or `catalogTypeId` does not exist, without persisting or changing anything. All cases run at the functional layer against the default scenario.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-19-01 | POST with unknown brand id 999 is rejected with 400 naming the id | sad | functional | Expected; Steps 1 |
| TC-BUG-19-02 | POST with unknown type id 999 is rejected with 400 naming the id | sad | functional | Expected; Steps 1 |
| TC-BUG-19-03 | PUT v2 on item 1 with unknown type id 999 is rejected and changes nothing | sad | functional | Expected; Steps 2 |
| TC-BUG-19-04 | PUT v2 on item 1 with unknown brand id 999 is rejected and changes nothing | sad | functional | Expected; update brand check |
| TC-BUG-19-05 | PUT v1 with an unknown brand id is rejected with 400 | sad | functional | v1 update route |
| TC-BUG-19-06 | POST with both brand and type unknown reports the brand only | sad | functional | Decision: brand first |
| TC-BUG-19-07 | PUT v2 on a missing item with an unknown brand id returns 404 | sad | functional | 404 before reference check |
| TC-BUG-19-08 | POST with highest existing brand 13 and type 8 succeeds | happy | functional | Boundary inside; happy path |
| TC-BUG-19-09 | POST with brand id 14 is rejected | sad | functional | Boundary outside |
| TC-BUG-19-10 | PUT v2 with existing brand 2 and type 3 still updates | happy | functional | Happy path update |

## Out of scope

- Acceptance criteria about `test.fixme` in `e2e/teststack/catalog-admin.spec.ts`, the `catalog-edge` scenario, `testing/teststack` and the bugs table in `testing/flows/`: these files do not exist in this repository.
- UI behavior: the bug is API only.

## Open questions

- Brand or type id 0 or negative: the story does not state the outcome; no case written (presumably 400 as they do not exist).
- Exact problem body beyond status and `detail` text (e.g. `title`) is not specified by the story.
- Behavior when the embedding service or event bus fails is not stated.
