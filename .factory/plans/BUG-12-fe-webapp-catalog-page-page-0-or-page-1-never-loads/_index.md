---
story: BUG-12
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/74"
story-sha: 197e47c417b3
plan-sha: 76de259db329
verified-score: 9
verified-at: "2026-11-14T15:51:01.940Z"
verified-by: test-planner@476d82b5/27d172f2
automation-sha: 970f503ab478
automation-plan-sha: 76de259db329
automation-score: 9
automation-verified-at: "2026-11-14T15:57:56.927Z"
---
# Test plan: BUG-12 [FE - WebApp] - Catalog page ?page=0 or ?page=-1 never loads

Scope: the WebApp catalog page (`/`) must treat a `page` query value below 1 as page 1 and render the first page instead of leaving the skeleton and error bar. All cases run through the browser on the test stack with scenario `default` (101 items, 12 pages of 9). The `catalog-edge` scenario, `testing/` folder and `catalog-browse.spec.ts` named in the story do not exist in this repository, so `default` is used.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-12-01 | ?page=0 shows the first catalog page | happy | e2e | Expected, Acceptance (?page=0) |
| TC-BUG-12-02 | ?page=-1 shows the first catalog page | sad | e2e | Expected, Acceptance (?page=-1) |
| TC-BUG-12-03 | ?page=1 still shows the first catalog page | happy | e2e | Regression |
| TC-BUG-12-04 | ?page=2 still shows the second catalog page | happy | e2e | Regression |
| TC-BUG-12-05 | Next on the clamped first page leads to page 2 | sad | e2e | Expected (navigation) |

## Out of scope

- Catalog.API rejecting negative `pageIndex` (BUG-11, a separate ticket).
- Removing the `test.fixme` marker, `catalog-browse.spec.ts` and the `testing/flows/` bugs table: files absent from this repository.

## Open questions

- Non-numeric `page` values (e.g. `?page=abc`) and values above the last page (e.g. `?page=13`): the story states no expected outcome, so no case is written.
- Whether the URL should be normalized for page below 1 is only stated in the implementation notes (URL stays as typed); asserted in cases 01 and 02 on that basis.
