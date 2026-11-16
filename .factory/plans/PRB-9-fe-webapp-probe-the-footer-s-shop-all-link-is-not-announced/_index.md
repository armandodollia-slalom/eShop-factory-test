---
story: PRB-9
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/185"
story-sha: 14af7539c271
plan-sha: 90514941f4e1
verified-score: 10
verified-at: "2026-11-16T14:54:19.753Z"
verified-by: test-planner@d8121b51/67b01306
automation-sha: 4df552841ea6
automation-plan-sha: 90514941f4e1
automation-score: 10
automation-verified-at: "2026-11-16T15:21:55.443Z"
---
# Test plan: PRB-9 The footer's "Shop all" link is not announced as the catalog

Scope: the footer's "Shop all" link under the **Shop** navigation (`nav[aria-label="Shop"]`) on the store's home page, on the test stack with the `default` scenario. The plan checks the three parts of **Expected** (the accessible name is "Shop all products", the visible text is still "Shop all", the destination is still the catalog) and, as a sad boundary case, that the bug's **Actual** (an accessible name of exactly "Shop all") no longer holds. All cases are `e2e` because the accessible name and navigation are only observable in the rendered WebApp; there is no unit test project for the WebApp's Razor markup.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-PRB-9-01 | Footer "Shop all" link's accessible name is "Shop all products" | happy | e2e | Expected: accessible name |
| TC-PRB-9-02 | Footer "Shop all" link's visible text is unchanged | happy | e2e | Expected: visible text unchanged |
| TC-PRB-9-03 | Footer "Shop all" link still opens the catalog | happy | e2e | Expected: destination unchanged |
| TC-PRB-9-04 | No footer Shop link is announced with the bare name "Shop all" | sad | e2e | Actual must no longer hold |

## Out of scope

- Accessible names of the footer's other links (social, Shop, Support, Company, Legal): the story does not change them.
- The footer on pages other than the home page: Steps to Reproduce name only the home page.
- Screen-reader output itself: the accessible name is checked through the browser's accessibility tree (Playwright role/name queries), not an actual screen reader.

## Open questions

- None. The only sad path the story implies is its **Actual** state (TC-PRB-9-04); it is a static-markup change with no input, identity or dependency, so validation, auth, ownership, not-found, concurrency, conflict and dependency-failure paths do not apply.
