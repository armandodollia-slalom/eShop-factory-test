---
story: BUG-48
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/249"
story-sha: 5df5c5742b90
plan-sha: 145ba854941c
verified-score: 10
verified-at: "2026-11-18T00:58:14.455Z"
verified-by: test-planner@6ab9e852/council
automation-sha: 4f513ef74327
automation-plan-sha: 145ba854941c
automation-score: 10
automation-verified-at: "2026-11-18T01:05:37.207Z"
---
# Test plan: BUG-48 [BE - Catalog API] - Catalog items fetched by several ids come back without their brand

Scope: `GET /api/catalog/items/by?ids=...&api-version=1.0` must answer every requested item with its `catalogBrand` (`id` and `brand`) filled in, exactly as `GET /api/catalog/items/{id}` and `GET /api/catalog/items` already do, while the rest of the answer (which items come back and every other field) stays unchanged. All cases run on the `functional` layer (`tests/Catalog.FunctionalTests`): the Catalog API in-process against a real Postgres seeded with the demo catalog, which is the same API and query path the bug report reproduces on the test stack, without needing the browser.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-48-01 | Items 1 and 2 fetched by ids each carry their own brand | happy | functional | Expected: every item in step 1 carries its brand (`catalogBrand` with `id` and `brand`); Actual (`catalogBrand: null`) no longer occurs; Expected: the same items |
| TC-BUG-48-02 | Each item fetched by ids is identical to the same item fetched on its own | happy | functional | Expected: "as in step 2" (`GET /api/catalog/items/{id}`); Expected: the same fields, everything else unchanged |
| TC-BUG-48-03 | An item fetched by ids carries the same brand as in the catalog list | happy | functional | Expected: "as in step 2" (`GET /api/catalog/items?pageSize=1`) |

## No sad path

The bug report only adds the brand to the items of a successful batch read. It names no error outcome and changes no existing one (reads are anonymous; no validation, not-found or auth behaviour is mentioned), so no sad case is planned.

## Out of scope

- `api-version=2.0` of the same route: the story reproduces and states the expected result only for `api-version=1.0` (see Open questions).
- Ids that do not exist, duplicate ids, or an empty `ids` list: the story says only that the same items come back; it does not describe these inputs.
- The WebApp UI: the bug is in the API answer; no user-visible flow is named, so no e2e case.

## Open questions

- `GET /api/catalog/items/by` is mapped on both API versions 1.0 and 2.0. The story only states the expected result for 1.0; whether 2.0 must be covered too is not stated. The fix (shared handler) applies to both.
- Behaviour for unknown ids in the `ids` list is not described by the story; it is assumed unchanged and not planned.
