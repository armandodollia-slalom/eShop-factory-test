---
story: PRB-3
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/158"
story-sha: 05eb9351481e
plan-sha: 084fbca175cc
verified-score: 10
verified-at: "2026-11-15T18:05:52.483Z"
verified-by: test-planner@1edb523e/67b01306
automation-sha: d2acf735e02e
automation-plan-sha: 084fbca175cc
automation-score: 10
automation-verified-at: "2026-11-15T18:27:20.930Z"
---
# Test plan: PRB-3 The catalog's browser tab title does not say which page it is

Scope: the WebApp catalog (home page, route `/`) must show the browser tab title "Catalog | AdventureWorks" on the running test stack (scenario `default`), and nothing else on the catalog page may change. The bug is only visible in the browser, so all three cases run at the `e2e` layer through the WebApp on the test stack.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-PRB-3-01 | Catalog home page tab title is "Catalog \| AdventureWorks" | happy | e2e | Expected: tab title "Catalog \| AdventureWorks"; Steps to Reproduce 1-2; Acceptance Criteria |
| TC-PRB-3-02 | Catalog page content is unchanged by the title fix | happy | e2e | Expected: "Nothing else on the page changes" |
| TC-PRB-3-03 | Leaving the catalog for an item page does not keep the "Catalog \| AdventureWorks" title | sad | e2e | Bug Report: every page's title names the page; Expected: "Nothing else on the page changes" |

## Out of scope

- Tab titles of the other WebApp pages (Shopping Bag, Checkout, Orders) checked on their own: the story names them only as the existing pattern and changes none of them. TC-PRB-3-03 checks only that the catalog title does not carry over to the item page reached from the catalog.
- The HybridApp: the story is about the WebApp only.
- Unit and functional layers: the title is rendered markup only reachable through the browser; no API or service behaviour changes.

## Open questions

- The story only covers opening the home page directly. Whether the title must also read "Catalog | AdventureWorks" on filtered or paged catalog URLs (`/?brand=…`, `/?page=2`) or after navigating back to the catalog from another page is not stated; no case asserts it.
