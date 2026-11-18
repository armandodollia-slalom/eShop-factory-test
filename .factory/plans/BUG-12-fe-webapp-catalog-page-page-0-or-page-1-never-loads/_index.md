---
story: BUG-12
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/74"
story-sha: be46e505a8af
plan-sha: 6e4ec18ada03
verified-score: 10
verified-at: "2026-11-14T20:01:50.329Z"
verified-by: test-planner@476d82b5/27d172f2
automation-sha: 27352d3ff085
automation-plan-sha: 6e4ec18ada03
automation-score: 10
automation-verified-at: "2026-11-14T20:20:05.251Z"
---
# Test plan: BUG-12 [FE - WebApp] - Catalog page ?page=0 or ?page=-1 never loads

Scope: the WebApp catalog page must treat a zero or negative `?page=` as page 1 (clamped in `Catalog.razor`, no redirect), render the first page and its pagination bar, and leave valid pages unchanged. All cases run through the UI on the test stack with scenario `default` (101 items, 9 per page, 12 pages). The story's `catalog-edge` scenario and existing `catalog-browse.spec.ts` do not exist in this repository; `default` suffices.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-12-01 | ?page=0 shows the first catalog page | sad | e2e | Expected, Steps to Reproduce, clamp |
| TC-BUG-12-02 | ?page=-1 shows the first catalog page | sad | e2e | Expected, Steps to Reproduce, clamp |
| TC-BUG-12-03 | ?page=-100 shows the first catalog page | sad | e2e | clamp for any value below 1 |
| TC-BUG-12-04 | ?page=0 pagination bar shows page 1 active with Previous disabled | sad | e2e | Code map: pagination |
| TC-BUG-12-05 | ?page=-1 pagination bar shows page 1 active with Previous disabled | sad | e2e | Code map: pagination |
| TC-BUG-12-06 | ?page=1 still shows the first page | happy | e2e | regression |
| TC-BUG-12-07 | No page parameter shows the first page | happy | e2e | Decisions: missing page |
| TC-BUG-12-08 | ?page=2 shows the second page, different from the first | happy | e2e | pageIndex = Page - 1 |
| TC-BUG-12-09 | ?page=12 shows the last page with 2 items | happy | e2e | upper valid boundary |

## Out of scope

- Catalog.API handling of negative paging (related ticket BUG-11).
- Removing `test.fixme` and the `testing/flows/` bugs-table row: those files do not exist in this repository.

## Open questions

- Behaviour for non-numeric `?page=abc` and for a page beyond the last (`?page=13`) is not stated by the story; no cases written.
- The story does not say whether the URL is rewritten; the Implementation Notes say it is not, which cases 01 and 02 assert.
