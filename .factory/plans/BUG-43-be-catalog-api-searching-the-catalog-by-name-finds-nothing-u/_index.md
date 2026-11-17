---
story: BUG-43
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/205"
story-sha: 9bbbf440f244
plan-sha: 7b53bbe725b5
verified-score: 9
verified-at: "2026-11-17T01:51:24.959Z"
verified-by: test-planner@d8121b51/council
automation-sha: a653680a5201
automation-plan-sha: 7b53bbe725b5
automation-score: 10
automation-verified-at: "2026-11-17T02:23:32.704Z"
---
# Test plan: BUG-43 [BE - Catalog API] - Searching the catalog by name finds nothing unless the capital letters match

Scope: the catalog name search must match item names from their start regardless of letter case, on v2 `GET /api/catalog/items?name=` and v1 `GET /api/catalog/items/by/{name}`, while starts-with semantics, paging and the type and brand filters stay as they are. All cases run on the `functional` layer (Catalog functional host against real Postgres, seeded with the same demo catalog as the test stack `default` scenario), because the defect lives in the database query and every check is an API response.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-43-01 | v2 search with name=Explorer (matching case) returns the four Explorer items | happy | functional | Step 1 (reference result) |
| TC-BUG-43-02 | v2 search with name=explorer (all lower case) returns the same four Explorer items | happy | functional | Step 2 |
| TC-BUG-43-03 | v2 search with name=EXPLORER (all upper case) returns the same four Explorer items | happy | functional | Step 3 |
| TC-BUG-43-04 | v1 GET /items/by/explorer returns the same four Explorer items | happy | functional | Step 4 |
| TC-BUG-43-05 | v2 search with name=Backpack returns no items (match stays anchored at the start) | sad (boundary) | functional | Starts-with semantics kept |
| TC-BUG-43-06 | Paging applies to a lower-case name search | happy | functional | Paging unchanged |
| TC-BUG-43-07 | Brand filter still narrows a lower-case name search | happy | functional | Brand filter unchanged |
| TC-BUG-43-08 | Type filter still narrows an upper-case name search | happy | functional | Type filter unchanged |

## Out of scope

- "Every other endpoint is unchanged": no new cases for endpoints that do not take a name (item by id, by ids, pictures, brand-mates, facets, semantic relevance, type/brand routes, catalog types and brands, create/update/delete). The existing `tests/Catalog.FunctionalTests` suite already covers them and acts as the regression net.
- UI flows: the bug is reported against the API only; no WebApp behavior is described.

## Open questions

- Search text containing LIKE wildcards (`%`, `_`): the Implementation Notes say they stay literal, but the ticket does not state the expected result, so no case is written.
- Mixed-case input (for example `eXpLoReR`) and non-ASCII case folding are not named by the ticket; covered in spirit by TC-BUG-43-02/03 but not tested separately.
- The ticket's acceptance criterion says "on the test stack"; the plan uses the functional host with the identical seed data, which is the project's layer for API contracts. If the reviewer requires a run on the deployed test stack, TC-BUG-43-01..04 would move to `e2e` (API calls on the test stack).
